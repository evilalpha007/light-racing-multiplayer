import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameEngine } from "../../engine/GameEngine";
import { LoadingScreen } from "../LoadingScreen";
import "./MultiplayerGame.css";

export const SinglePlayerGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(0);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [lastLapTime, setLastLapTime] = useState(0);
  const [fastestLapTime, setFastestLapTime] = useState(0);
  const [currentLap, setCurrentLap] = useState(1);
  const [maxLaps, setMaxLaps] = useState(3);
  const [raceResults, setRaceResults] = useState<{
    totalTime: number;
    fastestLap: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initGame = async () => {
      try {
        // Get canvas dimensions
        const container = canvasRef.current!.parentElement;
        const width = container?.clientWidth || window.innerWidth;
        const height = container?.clientHeight || window.innerHeight - 100;

        // Create game engine (enable bots for single-player mode)
        const engine = new GameEngine(canvasRef.current!, {
          width,
          height,
          enableBots: true, // Enable bots in single-player mode
        });

        // Load assets
        await engine.loadAssets();

        // Initialize game
        engine.init();

        // Handle race finish (no multiplayer callbacks needed)
        engine.setRaceFinishedCallback((results) => {
          setRaceResults(results);
        });

        // Start game
        engine.start();
        engineRef.current = engine;

        // Update HUD every frame
        const hudInterval = setInterval(() => {
          if (engineRef.current) {
            setSpeed(engineRef.current.getSpeed());
            setCurrentLapTime(engineRef.current.getCurrentLapTime());
            setLastLapTime(engineRef.current.getLastLapTime());
            setFastestLapTime(engineRef.current.getFastestLapTime());
            setCurrentLap(engineRef.current.getCurrentLap());
            setMaxLaps(engineRef.current.getMaxLaps());
          }
        }, 100);

        setLoading(false);

        return () => {
          clearInterval(hudInterval);
          engine.stop();
        };
      } catch (err: any) {
        console.error("Game initialization error:", err);
        setError(err.message || "Failed to initialize game");
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const handleLeave = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    navigate("/lobby");
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);
    const tenths = Math.floor(10 * (time - Math.floor(time)));

    if (minutes > 0) {
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${tenths}`;
    }
    return `${seconds}.${tenths}`;
  };

  return (
    <div className="game-container">
      {loading && (
        <LoadingScreen 
          onComplete={() => setLoading(false)}
          duration={2500}
        />
      )}

      {error && (
        <div className="game-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleLeave} className="btn-primary">
            Back to Lobby
          </button>
        </div>
      )}

      {raceResults && (
        <div className="game-results">
          <div className="results-content">
            <h2>🏁 Race Finished! 🏁</h2>
            <div className="result-item">
              <span>Total Time:</span>
              <span className="value">{formatTime(raceResults.totalTime)}</span>
            </div>
            <div className="result-item">
              <span>Fastest Lap:</span>
              <span className="value">
                {formatTime(raceResults.fastestLap)}
              </span>
            </div>
            <button onClick={handleLeave} className="btn-primary">
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !raceResults && (
        <div className="game-hud">
          <div className="hud-item">
            <span className="hud-label">Lap</span>
            <span className="hud-value">
              {currentLap}/{maxLaps}
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Speed</span>
            <span className="hud-value">{speed} mph</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Time</span>
            <span className="hud-value">{formatTime(currentLapTime)}</span>
          </div>
          {lastLapTime > 0 && (
            <div className="hud-item">
              <span className="hud-label">Last Lap</span>
              <span className="hud-value">{formatTime(lastLapTime)}</span>
            </div>
          )}
          {fastestLapTime > 0 && (
            <div className="hud-item fastest">
              <span className="hud-label">Fastest</span>
              <span className="hud-value">{formatTime(fastestLapTime)}</span>
            </div>
          )}
          <button onClick={handleLeave} className="btn-leave cursor-pointer">
            Back to Lobby
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="game-canvas" />

      {!loading && !error && !raceResults && (
        <div className="game-controls hidden lg:block">
          <p>🎮 Arrow Keys or WASD to control</p>
          <p>↑ Accelerate | ↓ Brake | ← → Steer</p>
          <p style={{ marginTop: "10px", fontSize: "0.9rem", opacity: 0.8 }}>
            🤖 Racing against bots
          </p>
        </div>
      )}
    </div>
  );
};
