import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        status: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing',
        code: 'AUTH_HEADER_MISSING'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({
        error: 'Token missing from authorization header',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      logger.warn('Invalid JWT token', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
        token: token.substring(0, 20) + '...', // Log partial token for debugging
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      }
    });

    if (!user) {
      logger.warn('User not found for valid token', {
        userId: decoded.userId,
        email: decoded.email,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'ACTIVE') {
      logger.warn('Inactive user attempted access', {
        userId: user.id,
        status: user.status,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'User account is not active',
        code: 'USER_INACTIVE',
        status: user.status
      });
    }

    // Add user to request object
    req.user = user;

    // Log successful authentication (debug level)
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      path: req.path
    });

    res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Middleware for role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Make role comparison case-insensitive
    const userRoleUpperCase = req.user.role.toUpperCase();
    const allowedRolesUpperCase = allowedRoles.map(role => role.toUpperCase());

    if (!allowedRolesUpperCase.includes(userRoleUpperCase)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user owns resource or has admin privileges
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'authorId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin and senior editors can access any resource
    if (['ADMIN', 'EDITOR_SENIOR'].includes(req.user.role)) {
      return next();
    }

    // For regular users, we'll need to check ownership at the controller level
    // since we need to fetch the resource first
    next();
  };
};

export default authMiddleware;