// Shared types between client and server

export interface User {
  _id: string;
  username: string;
  email: string;
  stats: {
    totalRaces: number;
    wins: number;
    bestLapTime: number;
  };
  createdAt: Date;
}

export interface PlayerPosition {
  playerId: string;
  username: string;
  x: number;
  z: number;
  speed: number;
  lapTime: number;
  position: number;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: "waiting" | "countdown" | "racing" | "finished";
  trackSeed: number;
  createdAt: Date;
}

export interface RoomPlayer {
  userId: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
  selectedCar?: string; // Car model ID
}

export interface RaceResult {
  userId: string;
  username: string;
  position: number;
  lapTime: number;
  finishTime: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  deviceFingerprint: string;
}

// Socket.IO Events
export interface ServerToClientEvents {
  "room-created": (room: Room) => void;
  "room-updated": (room: Room) => void;
  "room-closed": (roomId: string) => void;
  "player-joined": (player: RoomPlayer) => void;
  "player-left": (playerId: string) => void;
  "race-countdown": (count: number) => void;
  "race-started": () => void;
  "player-position": (position: PlayerPosition) => void;
  "race-finished": (results: RaceResult[]) => void;
  "session-expired": () => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "create-room": (
    roomName: string,
    callback: (room: Room | null) => void
  ) => void;
  "join-room": (roomId: string, callback: (success: boolean) => void) => void;
  "leave-room": () => void;
  "close-room": (roomId: string) => void;
  "toggle-ready": () => void;
  "start-race": () => void;
  "select-car": (carId: string) => void;
  "update-position": (
    position: Omit<PlayerPosition, "playerId" | "username">
  ) => void;
  "finish-race": (lapTime: number) => void;
}
