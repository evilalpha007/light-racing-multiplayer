import React, { useEffect, useState } from 'react';
import './MobileBlocker.css';

interface MobileBlockerProps {
  children: React.ReactNode;
}

export const MobileBlocker: React.FC<MobileBlockerProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024); // Consider tablets as mobile too
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-blocker">
        <div className="mobile-blocker-content">
          <div className="mobile-blocker-icon">
            🖥️
          </div>
          
          <h1 className="mobile-blocker-title">
            Desktop Only
          </h1>
          
          <p className="mobile-blocker-message">
            This game is currently only available for desktop devices.
          </p>
          
          <div className="mobile-blocker-badge">
            <span className="badge-icon">🚧</span>
            <span className="badge-text">Development Phase</span>
          </div>
          
          <p className="mobile-blocker-info">
            Mobile version is under development and will be available soon!
          </p>
          
          <div className="mobile-blocker-footer">
            <p>Please visit on a desktop or laptop to play</p>
            <div className="game-title-small">LIGHT RACING</div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
