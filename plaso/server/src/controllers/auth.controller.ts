import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { AppError, HttpStatus } from '../types';
import { emailService } from '../services/email.service';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new AppError('Please provide a valid email', HttpStatus.BAD_REQUEST);
      }

      if (!AuthService.validatePassword(password)) {
        throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, and a number', HttpStatus.BAD_REQUEST);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new AppError('This email is already registered.', HttpStatus.CONFLICT);
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.USER, // Force USER role for public registration
      });

      // Generate JWT
      const token = AuthService.generateToken(user);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login a user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // Find user
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // Check active status
      if (!user.isActive) {
        throw new AppError('Account is inactive', HttpStatus.FORBIDDEN);
      }

      // Verify password
      const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // Generate JWT
      const token = AuthService.generateToken(user);

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is populated by authenticate middleware
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', HttpStatus.UNAUTHORIZED);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user.isActive) {
        throw new AppError('Account is inactive', HttpStatus.FORBIDDEN);
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset link
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new AppError('Please provide a valid email format', HttpStatus.BAD_REQUEST);
      }

      const user = await User.findOne({ email: normalizedEmail });
      
      // Even if user is not found, we return success to prevent email enumeration
      if (!user) {
        res.status(HttpStatus.OK).json({
          success: true,
          message: 'If that email is registered, a reset link has been sent.',
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = AuthService.generateOtp();
      
      // Hash and store it
      user.passwordResetOtpHash = AuthService.hashToken(otp);
      user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      user.passwordResetOtpAttempts = 0;
      user.passwordResetOtpVerified = false;
      user.passwordResetOtpLastSentAt = new Date();
      await user.save();

      // Send email
      try {
        await emailService.sendPasswordResetEmail(user.email, otp, user.name);
        res.status(HttpStatus.OK).json({
          success: true,
          message: 'If that email is registered, a verification code has been sent.',
        });
      } catch (error) {
        // Clear token if email fails
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.passwordResetOtpAttempts = 0;
        user.passwordResetOtpVerified = false;
        await user.save();
        throw new AppError('Unable to send the reset email right now. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify the 6-digit OTP
   * POST /api/auth/verify-reset-otp
   */
  static async verifyResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AppError('Email and OTP are required', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
        throw new AppError('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
      }

      // Check expiry
      if (user.passwordResetOtpExpiresAt < new Date()) {
        throw new AppError('This OTP has expired. Please request a new one.', HttpStatus.BAD_REQUEST);
      }

      // Check max attempts
      if ((user.passwordResetOtpAttempts || 0) >= 5) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.passwordResetOtpVerified = false;
        await user.save();
        throw new AppError('Too many incorrect attempts. Please request a new OTP.', HttpStatus.BAD_REQUEST);
      }

      // Verify OTP hash
      const hashedOtp = AuthService.hashToken(otp);
      if (user.passwordResetOtpHash !== hashedOtp) {
        user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
        await user.save();
        throw new AppError('Incorrect verification code.', HttpStatus.BAD_REQUEST);
      }

      // OTP is correct
      user.passwordResetOtpVerified = true;
      user.passwordResetOtpAttempts = 0;
      await user.save();

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, newPassword, confirmPassword } = req.body;

      if (!email || !newPassword || !confirmPassword) {
        throw new AppError('Email, new password, and confirm password are required', HttpStatus.BAD_REQUEST);
      }

      if (newPassword !== confirmPassword) {
        throw new AppError('Passwords do not match', HttpStatus.BAD_REQUEST);
      }

      if (!AuthService.validatePassword(newPassword)) {
        throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, and a number', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        throw new AppError('Invalid request', HttpStatus.BAD_REQUEST);
      }

      if (!user.passwordResetOtpVerified) {
        throw new AppError('Email must be verified with OTP before resetting password', HttpStatus.FORBIDDEN);
      }

      // Set new password
      user.passwordHash = await AuthService.hashPassword(newPassword);
      
      // Clear OTP session fields
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
      user.passwordResetOtpVerified = false;
      user.passwordResetOtpLastSentAt = undefined;
      
      await user.save();

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
