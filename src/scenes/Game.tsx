import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createGameScene } from '../utils/threeSetup';
import { setupWebSocketConnection } from '../utils/websocket';
import { GameSettings, GameState, SceneManager, WebSocketClient, WsMessage } from '../types';
import SoundManager from '../services/SoundManager';

interface GameProps {
  onExit: () => void;
  settings: GameSettings;
}

const Game: React.FC<GameProps> = ({ onExit, settings }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocketClient | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    lives: 3,
    clicks: 0
  });
  const [fps, setFps] = useState<number>(0);
  const [soundsAvailable, setSoundsAvailable] = useState<{[key: string]: boolean}>({
    background: false,
    click: false,
    levelUp: false,
    gameover: false
  });

  // Initialize Three.js
  useEffect(() => {
    let sceneManager: SceneManager | null = null;
    let socketConnection: WebSocketClient | undefined;
    
    const init = async () => {
      // Create Three.js scene
      if (mountRef.current) {
        // Ensure createGameScene returns the proper SceneManager type with all required methods
        sceneManager = createGameScene(mountRef.current, settings);
        sceneManagerRef.current = sceneManager;
        
        // Set up websocket connection for multiplayer
        socketConnection = setupWebSocketConnection(
          (data: WsMessage) => {
            // Handle game state updates from server
            console.log('Game state update:', data);
            if (data.gameState) {
              setGameState(prev => ({ ...prev, ...data.gameState }));
            }
          },
          (error: Error) => {
            console.error('WebSocket error:', error);
          }
        );
        
        setSocket(socketConnection);
        
        // Load game sounds
        const soundManager = SoundManager.getInstance();
        
        // Add listeners for sound loading success or failure
        soundManager.on('load', (data: {id: string}) => {
          setSoundsAvailable(prev => ({...prev, [data.id]: true}));
          console.log(`Sound loaded: ${data.id}`);
        });
        
        soundManager.on('error', (data: {id: string}) => {
          setSoundsAvailable(prev => ({...prev, [data.id]: false}));
          console.warn(`Sound unavailable: ${data.id}`);
        });
        
        soundManager.preloadSounds([
          { 
            id: 'background', 
            url: '/sounds/background-music.mp3', 
            isMusic: true,
          },
          { 
            id: 'click', 
            url: '/sounds/click.mp3',
          },
          { 
            id: 'levelUp', 
            url: '/sounds/level-up.mp3',
          },
          { 
            id: 'gameover', 
            url: '/sounds/gameover.mp3',
          }
        ]).catch(err => {
          console.error('Failed to load game sounds:', err);
        });
      }
    };

    init();

    // Cleanup function
    return () => {
      // Clean up WebSocket connection
      if (socketConnection) {
        socketConnection.close();
        setSocket(null);
      }

      // Clean up scene manager
      if (sceneManager) {
        sceneManager.dispose();
        sceneManagerRef.current = null;
      }

      // Stop all sounds
      const soundManager = SoundManager.getInstance();
      soundManager.stop('background', { fadeOut: 0.5 });
      soundManager.stop('click');
      soundManager.stop('levelUp');
      soundManager.stop('gameover');
    };
  }, [settings]);
  
  // Update click counter from scene manager
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    
    const updateInterval = setInterval(() => {
      if (sceneManagerRef.current && !isPaused) {
        const clicks = sceneManagerRef.current.getClickCount();
        const currentClicks = gameState.clicks || 0;
        
        if (clicks !== currentClicks) {
          // Play click sound on each increment
          if (settings.soundEnabled && clicks > currentClicks && soundsAvailable.click) {
            const soundManager = SoundManager.getInstance();
            soundManager.play('click', { 
              volume: settings.soundVolume || 1.0,
              // Randomize pitch slightly for variety
              playbackRate: 0.9 + Math.random() * 0.2 
            });
          }
          
          setGameState(prev => ({
            ...prev,
            clicks
          }));
        }
      }
    }, 100); // Check for updates 10 times per second
    
    return () => clearInterval(updateInterval);
  }, [gameState.clicks, isPaused, settings, soundsAvailable.click]);
  
  // Update FPS counter
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    
    const updateFpsInterval = setInterval(() => {
      if (sceneManagerRef.current && !isPaused) {
        setFps(sceneManagerRef.current.getFPS());
      }
    }, 500); // Update FPS display twice per second
    
    return () => clearInterval(updateFpsInterval);
  }, [isPaused]);

  // Add keyboard event listener for Escape key to toggle pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Don't toggle if quit confirmation is shown
        if (!showQuitConfirm) {
          togglePause();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused, showQuitConfirm]);

  // Handle pause/resume
  const togglePause = (): void => {
    setIsPaused(!isPaused);
    
    // Pause/resume sound
    const soundManager = SoundManager.getInstance();
    if (isPaused) {
      // Resuming game
      if (settings.musicEnabled) {
        soundManager.resume('background');
      }
    } else {
      // Pausing game
      soundManager.pause('background');
    }
  };

  // Handle quit button click - show confirmation first
  const handleQuitClick = (): void => {
    setShowQuitConfirm(true);
    setIsPaused(true); // Pause the game when showing quit confirmation
    
    // Pause sound
    const soundManager = SoundManager.getInstance();
    soundManager.pause('background');
  };
  
  // Handle cancel quit
  const handleCancelQuit = (): void => {
    setShowQuitConfirm(false);
    setIsPaused(false); // Resume the game when canceling quit
    
    // Resume sound
    const soundManager = SoundManager.getInstance();
    if (settings.musicEnabled) {
      soundManager.resume('background');
    }
  };

  // Handle exit
  const handleExit = (): void => {
    // Play exit sound
    const soundManager = SoundManager.getInstance();
    soundManager.stop('background', { fadeOut: 0.5 });
    
    // Clean up and return to main menu
    onExit();
  };

  // Play background music when sound is loaded
  useEffect(() => {
    if (settings.musicEnabled && soundsAvailable.background && !isPaused) {
      const soundManager = SoundManager.getInstance();
      soundManager.play('background', { 
        loop: true, 
        volume: settings.musicVolume || 0.8,
        fadeIn: 2 
      });
    }
  }, [soundsAvailable.background, settings.musicEnabled, settings.musicVolume, isPaused]);

  return (
    <div className="game-container">
      {/* Three.js canvas */}
      <div ref={mountRef} className="game-canvas" />
      
      {/* HUD overlay */}
      <div className="game-hud">
        <div className="game-stats">
          <div>Score: {gameState.score}</div>
          <div>Level: {gameState.level}</div>
          <div>Lives: {gameState.lives}</div>
          <div>Cube Clicks: {gameState.clicks || 0}</div>
        </div>
        
        {/* FPS counter - only show if enabled in settings */}
        {settings.showFPS && (
          <div className="fps-counter">
            FPS: {fps}
          </div>
        )}
        
        {/* Sound availability warning */}
        {settings.soundEnabled && 
          Object.values(soundsAvailable).some(available => !available) && (
          <div className="sound-warning">
            ⚠️ Some sound files could not be loaded
          </div>
        )}
      </div>
      
      {/* Pause menu */}
      {isPaused && !showQuitConfirm && (
        <div className="pause-menu">
          <div className="menu-container">
            <h2>Game Paused</h2>
            <button onClick={togglePause}>Resume</button>
            <button onClick={handleQuitClick}>Exit to Main Menu</button>
          </div>
        </div>
      )}
      
      {/* Quit confirmation dialog */}
      {showQuitConfirm && (
        <div className="pause-menu">
          <div className="menu-container quit-dialog">
            <h2>Quit Game?</h2>
            <p>Are you sure you want to quit? Any unsaved progress will be lost.</p>
            <div className="button-group">
              <button onClick={handleCancelQuit}>Cancel</button>
              <button onClick={handleExit}>Confirm Quit</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game controls */}
      <div className="game-controls">
        <button className="pause-button" onClick={togglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  );
};

export default Game; 