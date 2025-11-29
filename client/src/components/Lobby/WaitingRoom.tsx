import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socketService } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import type { Room, RoomPlayer } from "../../../../shared/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./WaitingRoom.css";

export const WaitingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Track if we should block navigation
  const shouldBlockNavigation = useRef(true);

  useEffect(() => {
    if (!roomId) return;

    // Store room ID in localStorage for persistent session
    localStorage.setItem("currentRoomId", roomId);

    // Join room on mount/refresh
    socketService.joinRoom(roomId, (success) => {
      if (!success) {
        console.error("Failed to join room");
        localStorage.removeItem("currentRoomId");
        navigate("/lobby");
      }
    });

    // Listen for room updates
    socketService.onRoomUpdated((updatedRoom) => {
      setRoom(updatedRoom);
    });

    socketService.onPlayerJoined((player) => {
      console.log("Player joined:", player);
    });

    socketService.onPlayerLeft((playerId) => {
      console.log("Player left:", playerId);
    });

    socketService.onRaceCountdown((count) => {
      setCountdown(count);
    });

    socketService.onRaceStarted(() => {
      // Navigate to game
      navigate(`/game/${roomId}`);
    });

    // Listen for room-closed event
    socketService.onRoomClosed((closedRoomId) => {
      if (closedRoomId === roomId) {
        localStorage.removeItem("currentRoomId");
        navigate("/lobby");
      }
    });

    return () => {
      socketService.off("room-updated");
      socketService.off("player-joined");
      socketService.off("player-left");
      socketService.off("race-countdown");
      socketService.off("race-started");
      socketService.off("room-closed");
    };
  }, [roomId, navigate]);

  // Handle browser back button and navigation attempts
  useEffect(() => {
    if (!roomId) return;

    const handlePopState = () => {
      if (shouldBlockNavigation.current) {
        // Prevent the navigation
        window.history.pushState(null, "", window.location.href);

        // Show toast notification
        toast.warning("You must leave the room first before navigating away.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    // Push a state to enable back button detection
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [roomId]);

  const handleToggleReady = () => {
    socketService.toggleReady();
  };

  const handleStartRace = () => {
    socketService.startRace();
  };

  const handleLeaveRoom = () => {
    shouldBlockNavigation.current = false; // Allow navigation
    socketService.leaveRoom();
    localStorage.removeItem("currentRoomId");
    navigate("/lobby");
  };

  const handleCloseRoom = () => {
    if (!roomId) return;
    shouldBlockNavigation.current = false; // Allow navigation
    // @ts-expect-error - close-room is a server-side event
    socketService.socket?.emit("close-room", roomId);
    localStorage.removeItem("currentRoomId");
    navigate("/lobby");
  };

  if (!room) {
    return (
      <div className="waiting-room-container">
        <div className="loading">Loading room...</div>
      </div>
    );
  }

  // Find current user in room
  const currentPlayer = room.players.find((p) => p.userId === user?._id);
  const isHost = currentPlayer?.isHost || false;
  const allReady = room.players.every((p) => p.isReady || p.isHost);
  const minPlayersMet = room.players.length >= 2; // Minimum 2 players required
  const canStart = allReady && minPlayersMet;

  return (
    <div className="waiting-room-container">
      <ToastContainer theme="dark" />
      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-number">
            {countdown === 0 ? "GO!" : countdown}
          </div>
        </div>
      )}

      <div className="waiting-room-content">
        <div className="room-header">
          <h1>🏁 {room.name}</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            {isHost && (
              <button
                onClick={handleCloseRoom}
                className="btn-secondary"
                style={{ background: "#ef4444" }}
              >
                Close Room
              </button>
            )}
            <button onClick={handleLeaveRoom} className="btn-secondary">
              Leave Room
            </button>
          </div>
        </div>

        <div className="players-section">
          <h2>
            Players ({room.players.length}/{room.maxPlayers})
          </h2>

          <div className="players-list">
            {room.players.map((player: RoomPlayer) => (
              <div key={player.userId} className="player-card">
                <div className="player-info">
                  <span className="player-name">
                    {player.isHost && "👑 "}
                    {player.username}
                  </span>
                  {player.isReady && (
                    <span className="ready-badge">✓ Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="room-actions">
          {!isHost && (
            <button
              onClick={handleToggleReady}
              className="btn-primary btn-large"
            >
              {currentPlayer?.isReady ? "Not Ready" : "Ready"}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartRace}
              className="btn-primary btn-large"
              disabled={!canStart}
            >
              {!minPlayersMet
                ? "Need at least 2 players"
                : !allReady
                ? "Waiting for players to be ready..."
                : "Start Race"}
            </button>
          )}
        </div>

        <div className="room-info-box">
          <p>
            💡 <strong>Host:</strong>{" "}
            {room.players.find((p) => p.isHost)?.username}
          </p>
          <p>
            🎮 <strong>Status:</strong> {room.status}
          </p>
          <p>
            🏎️ <strong>Track Seed:</strong> {room.trackSeed}
          </p>
        </div>
      </div>
    </div>
  );
};
