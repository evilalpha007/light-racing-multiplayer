import { Session, ISession } from '../models/Session';
import mongoose from 'mongoose';

export class SessionService {
  /**
   * Create a new session
   */
  static async createSession(
    userId: string,
    deviceFingerprint: string,
    token: string
  ): Promise<ISession> {
    const session = await Session.create({
      userId: new mongoose.Types.ObjectId(userId),
      deviceFingerprint,
      token,
      isActive: true,
      lastActivity: new Date(),
    });
    return session;
  }

  /**
   * Terminate all active sessions for a user except the current one
   */
  static async terminateOtherSessions(
    userId: string,
    currentDeviceFingerprint: string
  ): Promise<number> {
    const result = await Session.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        deviceFingerprint: { $ne: currentDeviceFingerprint },
        isActive: true,
      },
      {
        $set: { isActive: false },
      }
    );
    return result.modifiedCount;
  }

  /**
   * Get active session by token
   */
  static async getActiveSession(token: string): Promise<ISession | null> {
    return await Session.findOne({ token, isActive: true });
  }

  /**
   * Update session activity
   */
  static async updateActivity(sessionId: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, {
      lastActivity: new Date(),
    });
  }

  /**
   * Terminate session
   */
  static async terminateSession(token: string): Promise<void> {
    await Session.updateOne({ token }, { $set: { isActive: false } });
  }

  /**
   * Update socket ID for session
   */
  static async updateSocketId(
    userId: string,
    socketId: string
  ): Promise<void> {
    await Session.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), isActive: true },
      { socketId }
    );
  }

  /**
   * Get session by socket ID
   */
  static async getSessionBySocketId(
    socketId: string
  ): Promise<ISession | null> {
    return await Session.findOne({ socketId, isActive: true });
  }
}
