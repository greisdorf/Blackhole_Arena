import React, { useState, useEffect } from 'react';
import OncadeService from '../services/OncadeService';
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenStore: () => void;
  isConnected: boolean;
  connectionError: string | null;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onOpenSettings, 
  onOpenStore, 
  isConnected, 
  connectionError 
}) => {
  
  const handleTipClick = async () => {
    try {
      const oncadeService = OncadeService.getInstance();
      const redirectUrl = `${window.location.origin}?tipStatus=success`;
      const tipUrl = await oncadeService.getTipJarURL(redirectUrl);
      
      if (tipUrl) {
        window.open(tipUrl, '_blank');
      } else {
        console.error('Error opening tip jar: No URL returned');
      }
    } catch (error) {
      console.error('Error opening tip jar:', error);
    }
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1>Oncade Game</h1>
        <div className="menu-buttons">
          <button onClick={onStartGame}>Play</button>
          <button 
            onClick={onOpenStore} 
            disabled={!isConnected}
            className={!isConnected ? 'button-disabled' : ''}
            title={!isConnected ? 'Connect to access the store' : ''}
          >
            Store
          </button>
          <button onClick={onOpenSettings}>Settings</button>
          <button 
            onClick={handleTipClick}
            disabled={!isConnected}
            className={!isConnected ? 'button-disabled' : ''}
            title={!isConnected ? 'Connect to tip the developer' : ''}
          >
            Tip Developer
          </button>
        </div>
        {connectionError && (
          <div className="connection-status error">
            <p>Connection error: {connectionError}</p>
            <button onClick={() => window.location.reload()}>Reconnect</button>
          </div>
        )}
        <div className="footer">
          <p>© 2025 Your Game Studio</p>
          <p>Powered by Oncade</p>
          <div className="connection-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className={isConnected ? 'status-online' : 'status-offline'}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 