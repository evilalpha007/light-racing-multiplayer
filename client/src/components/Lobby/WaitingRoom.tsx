import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socket';
import type { Room, RoomPlayer } from '../../../../shared/types';
import './WaitingRoom.css';

export const WaitingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Join room on mount/refresh
    socketService.joinRoom(roomId, (success) => {
      if (!success) {
        console.error('Failed to join room');
        navigate('/lobby');
      }
    });

    // Listen for room updates
    socketService.onRoomUpdated((updatedRoom) => {
      setRoom(updatedRoom);
    });

    socketService.onPlayerJoined((player) => {
      console.log('Player joined:', player);
    });

    socketService.onPlayerLeft((playerId) => {
      console.log('Player left:', playerId);
    });

    socketService.onRaceCountdown((count) => {
      setCountdown(count);
    });

    socketService.onRaceStarted(() => {
      // Navigate to game
      navigate(`/game/${roomId}`);
    });

    return () => {
      socketService.off('room-updated');
      socketService.off('player-joined');
      socketService.off('player-left');
      socketService.off('race-countdown');
      socketService.off('race-started');
    };
  }, [roomId, navigate]);

  const handleToggleReady = () => {
    socketService.toggleReady();
  };

  const handleStartRace = () => {
    socketService.startRace();
  };

  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    navigate('/lobby');
  };

  if (!room) {
    return (
      <div className="waiting-room-container">
        <div className="loading">Loading room...</div>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.isHost); // Simplified
  const isHost = currentPlayer?.isHost || false;
  const allReady = room.players.every((p) => p.isReady || p.isHost);

  return (
    <div className="waiting-room-container">
      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-number">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      <div className="waiting-room-content">
        <div className="room-header">
          <h1>🏁 {room.name}</h1>
          <button onClick={handleLeaveRoom} className="btn-secondary">
            Leave Room
          </button>
        </div>

        <div className="players-section">
          <h2>Players ({room.players.length}/{room.maxPlayers})</h2>
          
          <div className="players-list">
            {room.players.map((player: RoomPlayer) => (
              <div key={player.userId} className="player-card">
                <div className="player-info">
                  <span className="player-name">
                    {player.isHost && '👑 '}
                    {player.username}
                  </span>
                  {player.isReady && <span className="ready-badge">✓ Ready</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="room-actions">
          {!isHost && (
            <button onClick={handleToggleReady} className="btn-primary btn-large">
              {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartRace}
              className="btn-primary btn-large"
              disabled={!allReady}
            >
              {allReady ? 'Start Race' : 'Waiting for players...'}
            </button>
          )}
        </div>

        <div className="room-info-box">
          <p>💡 <strong>Host:</strong> {room.players.find(p => p.isHost)?.username}</p>
          <p>🎮 <strong>Status:</strong> {room.status}</p>
          <p>🏎️ <strong>Track Seed:</strong> {room.trackSeed}</p>
        </div>
      </div>
    </div>
  );
};
