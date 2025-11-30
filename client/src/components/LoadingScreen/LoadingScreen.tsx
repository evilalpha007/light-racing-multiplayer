import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number; 
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  duration = 3500 
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated Road Lines Background */}
      <div className="road-lines">
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>
      </div>

      <div className="car-container">
        <div className="car-animation">
          <svg 
            width="200" 
            height="80" 
            viewBox="0 0 200 80" 
            className="racing-car"
          >
            {/* Car Body */}
            <rect x="20" y="30" width="140" height="30" rx="5" fill="#e74c3c"/>
            {/* Car Roof */}
            <rect x="50" y="15" width="80" height="20" rx="5" fill="#c0392b"/>
            {/* Front Wheel */}
            <circle cx="50" cy="65" r="12" fill="#2c3e50"/>
            <circle cx="50" cy="65" r="6" fill="#34495e"/>
            {/* Back Wheel */}
            <circle cx="130" cy="65" r="12" fill="#2c3e50"/>
            <circle cx="130" cy="65" r="6" fill="#34495e"/>
            {/* Headlight */}
            <circle cx="165" cy="45" r="4" fill="#f1c40f"/>
            {/* Window */}
            <rect x="60" y="20" width="30" height="12" rx="2" fill="#3498db" opacity="0.7"/>
          </svg>
          
          {/* Speed Lines */}
          <div className="speed-lines">
            <div className="speed-line"></div>
            <div className="speed-line"></div>
            <div className="speed-line"></div>
          </div>
        </div>

        {/* Tire Marks */}
        <div className="tire-marks">
          <div className="tire-mark"></div>
          <div className="tire-mark"></div>
        </div>
      </div>

      {/* Text Animations */}
      <div className="text-container">
        <h1 className="game-title">
          <span className="title-word">LIGHT</span>
          <span className="title-word">RACING</span>
        </h1>
        
        <p className="creator-credit">
          Made by <span className="creator-name">Dibakar Sharma</span>
        </p>
      </div>

      {/* Loading Dots */}
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};
