import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket';
import type { Room } from '../../../../shared/types';
import './Lobby.css';

export const Lobby: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for room updates
    socketService.onRoomCreated((room) => {
      setRooms((prev) => [...prev, room]);
    });

    socketService.onRoomUpdated((room) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? room : r))
      );
    });

    // Fetch available rooms
    fetchRooms();

    return () => {
      socketService.off('room-created');
      socketService.off('room-updated');
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/rooms');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    setLoading(true);
    socketService.createRoom(roomName, (room) => {
      setLoading(false);
      if (room) {
        navigate(`/room/${room.id}`);
      } else {
        alert('Failed to create room');
      }
    });
  };

  const handleJoinRoom = (roomId: string) => {
    socketService.joinRoom(roomId, (success) => {
      if (success) {
        navigate(`/room/${roomId}`);
      } else {
        alert('Failed to join room');
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>🏁 Pixel Racing Lobby</h1>
        <div className="user-info">
          <span>👤 {user?.username}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="lobby-actions">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-large"
          >
            ➕ Create Room
          </button>
          <button onClick={fetchRooms} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>

        <div className="rooms-list">
          <h2>Available Rooms ({rooms.length})</h2>
          
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms available</p>
              <p>Create one to start racing!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <div className="room-header">
                    <h3>{room.name}</h3>
                    <span className={`status-badge status-${room.status}`}>
                      {room.status}
                    </span>
                  </div>
                  
                  <div className="room-info">
                    <p>
                      👥 {room.players.length}/{room.maxPlayers} Players
                    </p>
                    <p>🏎️ Host: {room.players.find(p => p.isHost)?.username}</p>
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="btn-primary"
                    disabled={room.status !== 'waiting' || room.players.length >= room.maxPlayers}
                  >
                    {room.status !== 'waiting' ? 'In Progress' : 
                     room.players.length >= room.maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Room</h2>
            
            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                maxLength={30}
                autoFocus
                className='text-black'
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="btn-primary"
                disabled={!roomName.trim() || loading}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
