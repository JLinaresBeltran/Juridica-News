import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validation';
import { logger, loggers } from '@/utils/logger';
import { authMiddleware } from '@/middleware/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest 
} from '../../../shared/types/user.types';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  department: z.string().optional(),
});

// JWT utility functions
const generateTokens = (user: any) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        password: true, // Campo correcto según el schema SQLite
        lastLogin: true,
      }
    });

    if (!user) {
      loggers.auth('login_failed', undefined, email, false);
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      loggers.auth('login_blocked_inactive', user.id, email, false);
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      loggers.auth('login_failed', user.id, email, false);
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      }
    });

    // Prepare user response (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      lastLogin: new Date().toISOString(),
    };

    res.json({
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
      message: 'Login successful'
    });

    loggers.auth('login_success', user.id, email, true);

  } catch (error) {
    logger.error('Login error', { error, email: req.body.email });
    res.status(500).json({
      error: 'Login service error',
      code: 'LOGIN_SERVICE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 */
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        password: passwordHash, // Campo correcto según esquema SQLite
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      },
      message: 'Registration successful'
    });

    loggers.auth('register_success', user.id, user.email, true);

  } catch (error) {
    logger.error('Registration error', { error, email: req.body.email });
    res.status(500).json({
      error: 'Registration service error',
      code: 'REGISTRATION_SERVICE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        department: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      }
    });

  } catch (error) {
    logger.error('Token refresh error', { error });
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        department: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ data: user });

  } catch (error) {
    logger.error('Profile retrieval error', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Profile service error',
      code: 'PROFILE_SERVICE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', [authMiddleware, validateRequest(updateProfileSchema)], async (req: Request, res: Response) => {
  try {
    const updates = req.body as UpdateProfileRequest;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        department: true,
        updatedAt: true,
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actionType: 'PREFERENCES_UPDATED',
        resourceType: 'user',
        resourceId: req.user.id,
        details: {
          updatedFields: Object.keys(updates),
        },
        result: { success: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Profile update error', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Profile update service error',
      code: 'PROFILE_UPDATE_SERVICE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Log audit trail (usando campos del esquema SQLite)
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_LOGOUT',
        description: 'User logged out successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      message: 'Logout successful'
    });

    loggers.auth('logout_success', req.user.id, req.user.email, true);

  } catch (error) {
    logger.error('Logout error', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Logout service error',
      code: 'LOGOUT_SERVICE_ERROR'
    });
  }
});

export default router;