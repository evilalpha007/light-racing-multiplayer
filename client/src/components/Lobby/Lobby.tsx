import React, { useState, useEffect, useRef, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socketService } from "../../services/socket";
import type { Room } from "../../../../shared/types";
import "./Lobby.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 3D imports (UI-only, logic untouched)
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { LogOut } from "lucide-react";

// Loading Screen
import { LoadingScreen } from "../LoadingScreen";

export const Lobby: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(true); // Loading screen state

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/rooms");
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  useEffect(() => {
    // Check for persistent session - restore user to their room if they have one
    const savedRoomId = localStorage.getItem("currentRoomId");
    if (savedRoomId) {
      // Verify room still exists by trying to join
      socketService.joinRoom(savedRoomId, (success) => {
        if (success) {
          navigate(`/room/${savedRoomId}`);
        } else {
          // Room doesn't exist anymore, clear it
          localStorage.removeItem("currentRoomId");
        }
      });
    }

    // Listen for room updates
    socketService.onRoomCreated((room) => {
      setRooms((prev) => {
        // Check if room already exists (avoid duplicates)
        if (prev.find((r) => r.id === room.id)) {
          return prev;
        }
        return [...prev, room];
      });
    });

    socketService.onRoomUpdated((room) => {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });

    socketService.onRoomClosed((roomId) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      // Clear localStorage if the closed room was the current one
      if (localStorage.getItem("currentRoomId") === roomId) {
        localStorage.removeItem("currentRoomId");
      }
    });

    // Fetch available rooms (use setTimeout to avoid synchronous setState in effect)
    setTimeout(() => {
      fetchRooms();
    }, 0);

    return () => {
      socketService.off("room-created");
      socketService.off("room-updated");
      socketService.off("room-closed");
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    // Check if user is already hosting a room
    const userHostedRoom = rooms.find((room) =>
      room.players.some(
        (player) => player.userId === user?._id && player.isHost
      )
    );

    if (userHostedRoom) {
      toast.error("You are already hosting a room! Please close it first.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setLoading(true);
    socketService.createRoom(roomName, (room) => {
      setLoading(false);
      if (room) {
        // Store room ID in localStorage for persistent session
        localStorage.setItem("currentRoomId", room.id);
        toast.success("Room created successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
        setShowCreateModal(false);
        setRoomName("");
        navigate(`/room/${room.id}`);
      } else {
        toast.error("Failed to create room");
      }
    });
  };

  const handleCloseRoom = (roomId: string) => {
    // @ts-expect-error - close-room is a server-side event
    socketService.socket?.emit("close-room", roomId);
    // Remove room ID from localStorage if it was the current room
    if (localStorage.getItem("currentRoomId") === roomId) {
      localStorage.removeItem("currentRoomId");
    }
    toast.info("Room closed", {
      position: "top-right",
      autoClose: 2000,
    });
    // Room will be removed from list via room-closed event
  };

  const handleJoinRoom = (roomId: string) => {
    socketService.joinRoom(roomId, (success) => {
      if (success) {
        // Store room ID in localStorage for persistent session
        localStorage.setItem("currentRoomId", roomId);
        navigate(`/room/${roomId}`);
      } else {
        toast.error("Failed to join room", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {showLoading && (
        <LoadingScreen 
          onComplete={() => setShowLoading(false)}
          duration={3500}
        />
      )}
      
      <div
        className="lobby-container"
      style={{
        background: `linear-gradient(rgba(26, 31, 46, 0.85), rgba(44, 62, 80, 0.85)), url('/racing-bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ToastContainer theme="dark" />
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: "2.5rem",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          LIGHT RACING
        </h1>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
              padding: "8px 16px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>💰</span>
            <span>5400</span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "8px 16px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>👤 {user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              padding: "10px 16px",
              borderRadius: 20,
              color: "#fff",
              fontSize: "1.2rem",
            }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
            padding: "14px 28px",
            borderRadius: 30,
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
          }}
        >
          ➕ Create Room
        </button>

        <button
          onClick={() => navigate("/single-player")}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: "none",
            padding: "14px 28px",
            borderRadius: 30,
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
          }}
        >
          🤖 Single Player
        </button>

        <button
          onClick={fetchRooms}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            padding: "14px 28px",
            borderRadius: 30,
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🔄 Refresh Rooms
        </button>
      </div>

      {/* Right Sidebar - Room List */}
      <div
        style={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          width: 320,
          maxHeight: "70vh",
          overflowY: "auto",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h3
          style={{
            color: "#fff",
            margin: 0,
            marginBottom: 8,
            fontSize: "1.2rem",
          }}
        >
          Available Rooms ({rooms.length})
        </h3>

        {rooms.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              padding: "20px",
              borderRadius: 15,
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
              color: "#9fb0c6",
            }}
          >
            <p style={{ margin: 0 }}>No rooms available</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>
              Create one to start racing!
            </p>
          </div>
        ) : (
          rooms.map((room) => {
            const isUserHost = room.players.some(
              (p) => p.userId === user?._id && p.isHost
            );
            return (
              <div
                key={room.id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  padding: "16px",
                  borderRadius: 15,
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h4 style={{ margin: 0, color: "#fff", fontSize: "1rem" }}>
                    {room.name}
                  </h4>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background:
                        room.status === "racing" ? "#f6b23b" : "#0ea5e9",
                      color: room.status === "racing" ? "#2a1f00" : "#042a33",
                    }}
                  >
                    {room.status}
                  </span>
                </div>

                <div
                  style={{
                    color: "#bcd3e7",
                    fontSize: "0.85rem",
                    marginBottom: 10,
                  }}
                >
                  <p style={{ margin: "4px 0" }}>
                    👥 {room.players.length}/{room.maxPlayers} Players
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    🏎️ Host:{" "}
                    {room.players.find((p) => p.isHost)?.username ?? "—"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {isUserHost ? (
                    <button
                      onClick={() => handleCloseRoom(room.id)}
                      style={{
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        width: "100%",
                        fontWeight: 700,
                        color: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      Close Room
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={
                        room.status !== "waiting" ||
                        room.players.length >= room.maxPlayers
                      }
                      style={{
                        background:
                          room.status !== "waiting" ||
                          room.players.length >= room.maxPlayers
                            ? "rgba(255,255,255,0.1)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        width: "100%",
                        fontWeight: 700,
                        color: "#fff",
                        cursor:
                          room.status !== "waiting" ||
                          room.players.length >= room.maxPlayers
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          room.status !== "waiting" ||
                          room.players.length >= room.maxPlayers
                            ? 0.5
                            : 1,
                      }}
                    >
                      {room.status !== "waiting"
                        ? "In Progress"
                        : room.players.length >= room.maxPlayers
                        ? "Full"
                        : "Join Room"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Center: 3D Car with Transparent Background */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60%",
          height: "70%",
          zIndex: 1,
          pointerEvents: "auto",
        }}
      >
        <Canvas
          camera={{ position: [0, 0.9, 3], fov: 50 }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight intensity={1.2} position={[5, 10, 5]} />
          <directionalLight intensity={0.5} position={[-5, 5, -5]} />
          <Suspense fallback={null}>
            <RotatingCar modelPath="/models/Convertible.glb" />
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </div>

      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 24,
              padding: "40px",
              width: "90%",
              maxWidth: 450,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              style={{
                margin: "0 0 24px 0",
                color: "#fff",
                fontSize: "1.8rem",
                fontWeight: 700,
              }}
            >
              Create New Room
            </h2>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#bcd3e7",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                maxLength={30}
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(59, 130, 246, 0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                }
              />
            </div>

            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "12px 28px",
                  borderRadius: 12,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "all 0.3s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || loading}
                style={{
                  background:
                    !roomName.trim() || loading
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  border: "none",
                  padding: "12px 32px",
                  borderRadius: 12,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor:
                    !roomName.trim() || loading ? "not-allowed" : "pointer",
                  opacity: !roomName.trim() || loading ? 0.5 : 1,
                  boxShadow:
                    !roomName.trim() || loading
                      ? "none"
                      : "0 4px 15px rgba(59, 130, 246, 0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

/* ---------------------------
   Small 3D helper inside same file (UI-only)
   - Rotates slowly (auto 360) but still lets user drag via OrbitControls
   - Expects model at /models/Convertible.glb; fallback car-like shape is shown if model missing
   --------------------------- */
function RotatingCar({
  modelPath = "/models/Convertible.glb",
}: {
  modelPath?: string;
}) {
  const group = useRef<{ rotation: { y: number } }>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.6; // adjust speed
  });

  // Always call the hook (hooks must be called unconditionally)
  // useGLTF will handle errors internally
  const gltf = useGLTF(modelPath);

  // If model loads successfully, render it
  if (gltf && gltf.scene) {
    return (
      <group ref={group} position={[0, -0.6, 0]}>
        <primitive object={gltf.scene} scale={[0.3, 0.3, 0.3]} />
      </group>
    );
  }

  // Fallback: More car-like placeholder (not just a box)
  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* Car body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.4, 2.4]} />
        <meshStandardMaterial color="#e74c3c" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Car roof/cabin */}
      <mesh position={[0, 0.5, -0.2]}>
        <boxGeometry args={[0.9, 0.35, 1.2]} />
        <meshStandardMaterial color="#c0392b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Front wheels */}
      <mesh position={[-0.6, -0.1, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, -0.1, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Back wheels */}
      <mesh position={[-0.6, -0.1, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, -0.1, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.4, 0.15, 1.21]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#f1c40f"
          emissive="#f1c40f"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.4, 0.15, 1.21]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#f1c40f"
          emissive="#f1c40f"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// Preload the model to avoid loading delays
useGLTF.preload("/models/Convertible.glb");
