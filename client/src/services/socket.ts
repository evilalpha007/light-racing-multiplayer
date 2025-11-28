import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Room,
  PlayerPosition,
  RaceResult,
} from '../../../shared/types';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private readonly url: string;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    this.socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    this.socket.on('session-expired', () => {
      console.warn('⚠️ Session expired');
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room management
  createRoom(roomName: string, callback: (room: Room | null) => void): void {
    this.socket?.emit('create-room', roomName, callback);
  }

  joinRoom(roomId: string, callback: (success: boolean) => void): void {
    this.socket?.emit('join-room', roomId, callback);
  }

  leaveRoom(): void {
    this.socket?.emit('leave-room');
  }

  toggleReady(): void {
    this.socket?.emit('toggle-ready');
  }

  startRace(): void {
    this.socket?.emit('start-race');
  }

  // Game updates
  updatePosition(position: Omit<PlayerPosition, 'playerId' | 'username'>): void {
    this.socket?.emit('update-position', position);
  }

  finishRace(lapTime: number): void {
    this.socket?.emit('finish-race', lapTime);
  }

  // Event listeners
  onRoomCreated(callback: (room: Room) => void): void {
    this.socket?.on('room-created', callback);
  }

  onRoomUpdated(callback: (room: Room) => void): void {
    this.socket?.on('room-updated', callback);
  }

  onPlayerJoined(callback: (player: any) => void): void {
    this.socket?.on('player-joined', callback);
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    this.socket?.on('player-left', callback);
  }

  onRaceCountdown(callback: (count: number) => void): void {
    this.socket?.on('race-countdown', callback);
  }

  onRaceStarted(callback: () => void): void {
    this.socket?.on('race-started', callback);
  }

  onPlayerPosition(callback: (position: PlayerPosition) => void): void {
    this.socket?.on('player-position', callback);
  }

  onRaceFinished(callback: (results: RaceResult[]) => void): void {
    this.socket?.on('race-finished', callback);
  }

  // Remove listeners
  off(event: keyof ServerToClientEvents): void {
    this.socket?.off(event);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
