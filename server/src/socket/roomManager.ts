import { Room, RoomPlayer, PlayerPosition, RaceResult } from "../shared/types";
// import { Room, RoomPlayer, PlayerPosition, RaceResult } from '@shared/types';
import { v4 as uuidv4 } from "uuid";

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();
  private playerPositions: Map<string, Map<string, PlayerPosition>> = new Map();

  /**
   * Create a new room
   */
  createRoom(hostId: string, hostUsername: string, roomName: string): Room {
    const roomId = uuidv4();
    const trackSeed = Math.floor(Math.random() * 1000000);

    const room: Room = {
      id: roomId,
      name: roomName,
      hostId,
      players: [
        {
          userId: hostId,
          username: hostUsername,
          isReady: false,
          isHost: true,
        },
      ],
      maxPlayers: 4,
      status: "waiting",
      trackSeed,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.userToRoom.set(hostId, roomId);
    this.playerPositions.set(roomId, new Map());

    return room;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, userId: string, username: string): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    if (room.status !== "waiting") {
      return null;
    }

    if (room.players.length >= room.maxPlayers) {
      return null;
    }

    // Check if user already in room
    if (room.players.some((p) => p.userId === userId)) {
      return room;
    }

    room.players.push({
      userId,
      username,
      isReady: false,
      isHost: false,
    });

    this.userToRoom.set(userId, roomId);
    return room;
  }

  /**
   * Leave room
   */
  leaveRoom(userId: string): { roomId: string; room: Room | null } | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    // Remove player
    room.players = room.players.filter((p) => p.userId !== userId);
    this.userToRoom.delete(userId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      this.playerPositions.delete(roomId);
      return { roomId, room: null };
    }

    // If host left, assign new host
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].userId;
      room.players[0].isHost = true;
    }

    return { roomId, room };
  }

  /**
   * Toggle player ready status
   */
  toggleReady(userId: string): Room | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.isReady = !player.isReady;
    }

    return room;
  }

  /**
   * Start race (host only)
   * Allows starting with minimum 2 players (host + 1 other player)
   */
  startRace(userId: string): Room | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) {
      return null;
    }

    // Require at least 2 players (host + 1 other)
    if (room.players.length < 2) {
      return null;
    }

    // Check if all players are ready (host doesn't need to be ready)
    const allReady = room.players.every((p) => p.isReady || p.isHost);
    if (!allReady) {
      return null;
    }

    room.status = "countdown";
    return room;
  }

  /**
   * Set race status
   */
  setRaceStatus(roomId: string, status: Room["status"]): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
    }
  }

  /**
   * Update player position
   */
  updatePlayerPosition(
    userId: string,
    position: Omit<PlayerPosition, "playerId" | "username">
  ): PlayerPosition | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const player = room.players.find((p) => p.userId === userId);
    if (!player) {
      return null;
    }

    const fullPosition: PlayerPosition = {
      playerId: userId,
      username: player.username,
      ...position,
    };

    const roomPositions = this.playerPositions.get(roomId);
    if (roomPositions) {
      roomPositions.set(userId, fullPosition);
    }

    return fullPosition;
  }

  /**
   * Get all player positions in a room
   */
  getRoomPositions(roomId: string): PlayerPosition[] {
    const positions = this.playerPositions.get(roomId);
    if (!positions) {
      return [];
    }
    return Array.from(positions.values());
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get room by user ID
   */
  getRoomByUserId(userId: string): Room | undefined {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) {
      return undefined;
    }
    return this.rooms.get(roomId);
  }

  /**
   * Get all available rooms
   */
  getAvailableRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) =>
        room.status === "waiting" && room.players.length < room.maxPlayers
    );
  }

  /**
   * Get all rooms (for displaying in lobby)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.status === "waiting"
    );
  }

  /**
   * Get room ID by user ID
   */
  getRoomIdByUserId(userId: string): string | undefined {
    return this.userToRoom.get(userId);
  }

  /**
   * Delete a room completely (used when host closes room)
   */
  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // Remove all players from userToRoom mapping
    room.players.forEach((player) => {
      this.userToRoom.delete(player.userId);
    });

    // Delete the room and its positions
    this.rooms.delete(roomId);
    this.playerPositions.delete(roomId);

    return true;
  }
}
