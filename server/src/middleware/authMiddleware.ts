import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwtService';
import { SessionService } from '../services/sessionService';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
  email?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const payload = JWTService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Check if session is active
    const session = await SessionService.getActiveSession(token);
    if (!session) {
      res.status(401).json({ error: 'Session expired or terminated' });
      return;
    }

    // Update session activity
    await SessionService.updateActivity(session._id.toString());

    // Attach user info to request
    req.userId = payload.userId;
    req.username = payload.username;
    req.email = payload.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
