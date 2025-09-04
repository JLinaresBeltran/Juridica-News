export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR_SENIOR = 'EDITOR_SENIOR',
  EDITOR = 'EDITOR',
  REVIEWER = 'REVIEWER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  professionalTitle?: string;
  barAssociationNumber?: string;
  role: UserRole;
  status: UserStatus;
  
  // Activity
  lastLogin?: string;
  loginCount: number;
  articlesCreated: number;
  articlesPublished: number;
  
  // Preferences
  preferences?: UserPreferences;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  autoSaveInterval: number;
  showAiConfidence: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  defaultGenerationTone: 'PROFESSIONAL' | 'ACADEMIC' | 'ACCESSIBLE';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  professionalTitle?: string;
  barAssociationNumber?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  professionalTitle?: string;
  barAssociationNumber?: string;
  preferences?: Partial<UserPreferences>;
}