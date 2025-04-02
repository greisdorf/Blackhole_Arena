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
          <button onClick={onStartGame}>
            <svg className="button-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <span>Play</span>
          </button>
          <button 
            onClick={onOpenStore} 
            disabled={!isConnected}
            className={!isConnected ? 'button-disabled' : ''}
            title={!isConnected ? 'Connect to access the store' : ''}
          >
            <svg className="button-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" fill="currentColor"/>
            </svg>
            <span>Store</span>
          </button>
          <button 
            onClick={handleTipClick}
            disabled={!isConnected}
            className={!isConnected ? 'button-disabled' : ''}
            title={!isConnected ? 'Connect to tip the developer' : ''}
          >
            <svg className="button-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
            <span>Tip Developer</span>
          </button>
          <button onClick={onOpenSettings}>
            <svg className="button-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
            </svg>
            <span>Settings</span>
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