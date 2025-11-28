import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config/env';
import connectDatabase from './config/database';
import authRoutes from './routes/authRoutes';
import { SocketHandler } from './socket/socketHandler';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './shared/types';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration - handle multiple origins
const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or if wildcard is set
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Initialize Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO handler
const socketHandler = new SocketHandler(io);

// Get available rooms endpoint
app.get('/api/rooms', (req, res) => {
  const rooms = socketHandler.getAvailableRooms();
  res.json({ rooms });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log('');
      console.log('🚗 ═══════════════════════════════════════════════════════');
      console.log('🏁   Racing Multiplayer Server');
      console.log('🚗 ═══════════════════════════════════════════════════════');
      console.log('');
      console.log(`   🌐 Server running on: http://localhost:${config.port}`);
      // console.log(`   🗄️  Database: ${config.mongodbUri}`);
      console.log(`   🔌 WebSocket ready for connections`);
      // console.log(`   🌍 Environment: ${config.nodeEnv}`);
      console.log('');
      console.log('🚗 ═══════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
