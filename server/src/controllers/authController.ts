import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { JWTService } from '../services/jwtService';
import { SessionService } from '../services/sessionService';
import { DeviceService } from '../services/deviceService';
import { emailService } from '../services/emailService';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, deviceFingerprint } = req.body;

      // Validate input
      if (!username || !email || !password || !deviceFingerprint) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        res.status(400).json({
          error:
            existingUser.email === email
              ? 'Email already registered'
              : 'Username already taken',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        stats: {
          totalRaces: 0,
          wins: 0,
          bestLapTime: 0,
        },
      });

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      });

      // Create session
      await SessionService.createSession(
        user._id.toString(),
        deviceFingerprint,
        token
      );

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          stats: user.stats,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, deviceFingerprint } = req.body;

      // Validate input
      if (!email || !password || !deviceFingerprint) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Terminate other sessions (single device enforcement)
      const terminatedCount = await SessionService.terminateOtherSessions(
        user._id.toString(),
        deviceFingerprint
      );

      if (terminatedCount > 0) {
        console.log(
          `Terminated ${terminatedCount} session(s) for user ${user.username}`
        );
      }

      // Generate new JWT token
      const token = JWTService.generateToken({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      });

      // Create new session
      await SessionService.createSession(
        user._id.toString(),
        deviceFingerprint,
        token
      );

      res.status(200).json({
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          stats: user.stats,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await SessionService.terminateSession(token);
      }

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  /**
   * Get current user
   */
  static async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Validate input
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not for security
        res.status(200).json({
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save hashed token and expiration to user
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Get frontend URL from environment or use default
      const frontendUrl =
        process.env.FRONTEND_URL || 'http://localhost:5173';

      // Send email
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        frontendUrl
      );

      console.log(`✅ Password reset requested for: ${user.email}`);

      res.status(200).json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Validate input
      if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      // Hash the token from URL
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Terminate all existing sessions for security
      await SessionService.terminateAllSessions(user._id.toString());

      console.log(`✅ Password reset successful for: ${user.email}`);

      res.status(200).json({
        message: 'Password reset successful. You can now login with your new password.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
}
