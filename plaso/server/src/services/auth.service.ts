import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env';
import { IUser } from '../models/user.model';

export interface TokenPayload {
  userId: string;
  role: string;
}

export class AuthService {
  /**
   * Hashes a plaintext password using bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compares a plaintext password with a hashed password.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates a JWT for an authenticated user.
   */
  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id ? user._id.toString() : '',
      role: user.role,
    };

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verifies a JWT and extracts the payload.
   */
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  }

  /**
   * Validates a password against strong requirements.
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   */
  static validatePassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
  }

  /**
   * Generates a cryptographically random 6-digit OTP for password reset.
   */
  static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hashes a token for secure storage.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
