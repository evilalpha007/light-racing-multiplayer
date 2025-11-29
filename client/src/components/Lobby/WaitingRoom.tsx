import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socketService } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import type { Room, RoomPlayer } from "../../../../shared/types";
import { toast, ToastContainer } from "react-toastify";
import { Users, Crown, Zap, LogOut, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { WaitingRoomScene } from "../3D/WaitingRoomScene";
import { CAR_MODELS } from "../../constants/carModels";

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

  const handleCarSelect = (carId: string) => {
    socketService.selectCar(carId);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-300 animate-pulse">
          Loading room...
        </div>
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
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <ToastContainer theme="dark" />
      
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      
      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
            {countdown === 0 ? "GO!" : countdown}
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Top Header - Room ID & Exit */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600/30 p-3 rounded-xl border border-purple-400/50">
                  <Zap className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    🏁 {room.name}
                  </h1>
                  <p className="text-purple-300 font-mono text-sm">
                    ID: {roomId || "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                {isHost ? (
                  <button 
                    onClick={handleCloseRoom}
                    className="px-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-xl font-bold text-red-300 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Close Room
                  </button>
                ) : (
                  <button 
                    onClick={handleLeaveRoom}
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-500/50 rounded-xl font-bold text-slate-300 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Leave
                </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Side - Action Buttons */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col justify-center">
              {!isHost ? (
                <button 
                  onClick={handleToggleReady}
                  className="w-full py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-black text-2xl text-white shadow-lg shadow-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/60"
                >
                  {currentPlayer?.isReady ? "NOT READY" : "READY UP"}
                </button>
              ) : (
                <button 
                  onClick={handleStartRace}
                  disabled={!canStart}
                  className={`w-full py-6 rounded-xl font-black text-2xl text-white shadow-lg transition-all ${
                    canStart 
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/50 hover:scale-105 hover:shadow-xl hover:shadow-green-500/60 cursor-pointer" 
                      : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {!minPlayersMet
                    ? "NEED 2+ PLAYERS"
                    : !allReady
                    ? "WAITING..."
                    : "START RACE"}
                </button>
              )}
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-semibold">
                    {room.players.length}/{room.maxPlayers} Players
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-semibold">
                    Status: {room.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - 3D Car Display */}
          <div className="col-span-6 flex flex-col gap-4">
            {/* 3D Scene */}
            <div className="bg-gradient-to-br from-slate-800/30 to-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl h-[60%] shadow-2xl overflow-hidden">
              <WaitingRoomScene players={room.players} />
            </div>
            
            {/* Car Selection Grid */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl h-[40%] overflow-hidden flex flex-col">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                🏎️ SELECT YOUR CAR
              </h3>
              <div className="grid grid-cols-7 gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {CAR_MODELS.map((car) => {
                  const isSelected = currentPlayer?.selectedCar === car.id;
                  return (
                    <button
                      key={car.id}
                      onClick={() => handleCarSelect(car.id)}
                      className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-600/30 shadow-lg shadow-purple-500/50'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-purple-400/50'
                      }`}
                      title={car.name}
                    >
                      <div 
                        className="absolute inset-0 rounded-lg opacity-40"
                        style={{ backgroundColor: car.thumbnailColor }}
                      />
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <span className="text-2xl">🚗</span>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Players & Room Info */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Players List */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl flex-1 overflow-hidden flex flex-col">
              <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                PLAYERS
              </h2>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {room.players.map((player: RoomPlayer) => (
                  <div
                    key={player.userId}
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {player.isHost && (
                          <Crown className="w-5 h-5 text-yellow-400" />
                        )}
                        <span className="font-bold text-white">
                          {player.username}
                        </span>
                      </div>
                      {player.isReady && (
                        <span className="px-3 py-1 bg-green-600/30 border border-green-500/50 rounded-lg text-green-300 text-xs font-bold">
                          ✓ READY
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Info */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-3">ROOM INFO</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Host:</span>
                  <span className="text-white font-bold">
                    {room.players.find(p => p.isHost)?.username || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Track Seed:</span>
                  <span className="text-purple-300 font-mono text-xs">
                    {room.trackSeed || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};
