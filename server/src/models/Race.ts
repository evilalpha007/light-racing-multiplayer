import mongoose, { Document, Schema } from 'mongoose';

interface IRacePlayer {
  userId: mongoose.Types.ObjectId;
  username: string;
  position: number;
  lapTime: number;
  finishTime?: Date;
}

export interface IRace extends Document {
  roomId: string;
  players: IRacePlayer[];
  trackSeed: number;
  startTime: Date;
  endTime?: Date;
  status: 'waiting' | 'racing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

const raceSchema = new Schema<IRace>(
  {
    roomId: {
      type: String,
      required: true,
    },
    players: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        position: {
          type: Number,
          default: 0,
        },
        lapTime: {
          type: Number,
          default: 0,
        },
        finishTime: {
          type: Date,
        },
      },
    ],
    trackSeed: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['waiting', 'racing', 'finished'],
      default: 'waiting',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
raceSchema.index({ roomId: 1 });
raceSchema.index({ 'players.userId': 1 });
raceSchema.index({ createdAt: -1 });

export const Race = mongoose.model<IRace>('Race', raceSchema);
