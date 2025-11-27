import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { JWTService } from '../services/jwtService';
import { SessionService } from '../services/sessionService';
import { DeviceService } from '../services/deviceService';

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
}
