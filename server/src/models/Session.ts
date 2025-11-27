import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceFingerprint: string;
  token: string;
  socketId?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    socketId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ deviceFingerprint: 1 });

// Auto-expire inactive sessions after 7 days
sessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 604800 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
