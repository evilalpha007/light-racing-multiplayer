import { Server, Socket } from 'socket.io';
import { JWTService } from '../services/jwtService';
import { SessionService } from '../services/sessionService';
import { RoomManager } from './roomManager';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerPosition,
} from '../../../shared/types';

interface SocketData {
  userId: string;
  username: string;
  email: string;
}

export class SocketHandler {
  private io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
  private roomManager: RoomManager;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  /**
   * Setup authentication middleware for Socket.IO
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT
        const payload = JWTService.verifyToken(token);
        if (!payload) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Check session
        const session = await SessionService.getActiveSession(token);
        if (!session) {
          return next(new Error('Authentication error: Session expired'));
        }

        // Attach user data to socket
        socket.data.userId = payload.userId;
        socket.data.username = payload.username;
        socket.data.email = payload.email;

        // Update socket ID in session
        await SessionService.updateSocketId(payload.userId, socket.id);

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  /**
   * Setup connection handler
   */
  private setupConnectionHandler(): void {
    this.io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.data.username} (${socket.id})`);

      this.handleCreateRoom(socket);
      this.handleJoinRoom(socket);
      this.handleLeaveRoom(socket);
      this.handleToggleReady(socket);
      this.handleStartRace(socket);
      this.handleUpdatePosition(socket);
      this.handleFinishRace(socket);
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle create room
   */
  private handleCreateRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('create-room', (roomName, callback) => {
      try {
        const room = this.roomManager.createRoom(
          socket.data.userId,
          socket.data.username,
          roomName
        );

        socket.join(room.id);
        callback(room);

        console.log(`🎮 Room created: ${room.name} by ${socket.data.username}`);
      } catch (error) {
        console.error('Create room error:', error);
        callback(null);
      }
    });
  }

  /**
   * Handle join room
   */
  private handleJoinRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('join-room', (roomId, callback) => {
      try {
        const room = this.roomManager.joinRoom(
          roomId,
          socket.data.userId,
          socket.data.username
        );

        if (!room) {
          callback(false);
          return;
        }

        socket.join(roomId);
        callback(true);

        // Notify all players in room
        this.io.to(roomId).emit('room-updated', room);

        const newPlayer = room.players.find((p) => p.userId === socket.data.userId);
        if (newPlayer) {
          socket.to(roomId).emit('player-joined', newPlayer);
        }

        console.log(`👤 ${socket.data.username} joined room: ${room.name}`);
      } catch (error) {
        console.error('Join room error:', error);
        callback(false);
      }
    });
  }

  /**
   * Handle leave room
   */
  private handleLeaveRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('leave-room', () => {
      this.leaveCurrentRoom(socket);
    });
  }

  /**
   * Handle toggle ready
   */
  private handleToggleReady(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('toggle-ready', () => {
      try {
        const room = this.roomManager.toggleReady(socket.data.userId);
        if (room) {
          this.io.to(room.id).emit('room-updated', room);
        }
      } catch (error) {
        console.error('Toggle ready error:', error);
      }
    });
  }

  /**
   * Handle start race
   */
  private handleStartRace(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('start-race', () => {
      try {
        const room = this.roomManager.startRace(socket.data.userId);
        if (!room) {
          socket.emit('error', 'Cannot start race');
          return;
        }

        // Start countdown
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          this.io.to(room.id).emit('race-countdown', countdown);
          countdown--;

          if (countdown < 0) {
            clearInterval(countdownInterval);
            this.roomManager.setRaceStatus(room.id, 'racing');
            this.io.to(room.id).emit('race-started');
            console.log(`🏁 Race started in room: ${room.name}`);
          }
        }, 1000);
      } catch (error) {
        console.error('Start race error:', error);
      }
    });
  }

  /**
   * Handle update position
   */
  private handleUpdatePosition(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('update-position', (position) => {
      try {
        const fullPosition = this.roomManager.updatePlayerPosition(
          socket.data.userId,
          position
        );

        if (fullPosition) {
          const roomId = this.roomManager.getRoomIdByUserId(socket.data.userId);
          if (roomId) {
            // Broadcast to other players in room
            socket.to(roomId).emit('player-position', fullPosition);
          }
        }
      } catch (error) {
        console.error('Update position error:', error);
      }
    });
  }

  /**
   * Handle finish race
   */
  private handleFinishRace(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('finish-race', (lapTime) => {
      try {
        const room = this.roomManager.getRoomByUserId(socket.data.userId);
        if (!room) {
          return;
        }

        // TODO: Store race results in database
        console.log(`🏆 ${socket.data.username} finished with time: ${lapTime}s`);

        // For now, just notify the room
        // In a full implementation, you'd track all finishers and emit final results
      } catch (error) {
        console.error('Finish race error:', error);
      }
    });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.data.username} (${socket.id})`);
      this.leaveCurrentRoom(socket);
    });
  }

  /**
   * Helper: Leave current room
   */
  private leaveCurrentRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    try {
      const result = this.roomManager.leaveRoom(socket.data.userId);
      if (result) {
        const { roomId, room } = result;
        socket.leave(roomId);

        if (room) {
          // Notify remaining players
          this.io.to(roomId).emit('room-updated', room);
          this.io.to(roomId).emit('player-left', socket.data.userId);
        }

        console.log(`👋 ${socket.data.username} left room`);
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  /**
   * Get available rooms (for lobby)
   */
  getAvailableRooms() {
    return this.roomManager.getAvailableRooms();
  }
}
