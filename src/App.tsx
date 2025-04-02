import React, { useState, useEffect } from 'react';
import Game from './scenes/Game';
import MainMenu from './components/MainMenu';
import SettingsMenu from './components/SettingsMenu';
import StoreMenu from './components/StoreMenu';
import PurchaseSuccess from './components/PurchaseSuccess';
import TipSuccessModal from './components/TipSuccessModal';
import { GameSettings } from './types/index';
import { SETTINGS_STORAGE_KEY } from './utils/constants';
import SoundManager from './services/SoundManager';
import OncadeService from './services/OncadeService';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('mainMenu');
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 1.0,
    musicVolume: 0.8,
    difficulty: 'normal',
    graphicsQuality: 'high',
    showFPS: false
  });

  // Connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Oncade SDK status
  const [sdkInitialized, setSdkInitialized] = useState<boolean>(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Tip success modal state
  const [showTipSuccessModal, setShowTipSuccessModal] = useState<boolean>(false);
  const [tipTransactionHash, setTipTransactionHash] = useState<string>('');

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as GameSettings;
        setGameSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse settings from localStorage:', error);
      }
    }
    
    // Check URL path for purchase-success and set the appropriate screen
    if (window.location.pathname.includes('purchase-success')) {
      setCurrentScreen('purchaseSuccess');
    }

    // Check URL query parameters for tip success
    const urlParams = new URLSearchParams(window.location.search);
    const tipStatus = urlParams.get('tipStatus');
    
    if (tipStatus === 'success') {
      setShowTipSuccessModal(true);
    }
  }, []);

  // Initialize Oncade SDK
  useEffect(() => {
    let isMounted = true;

    const initOncadeSDK = async () => {
      try {
        setIsInitializing(true);
        console.log('Initializing Oncade SDK...');
        const oncadeService = OncadeService.getInstance();
        
        // The service already loads API keys from environment variables
        // If you want to set them manually, uncomment:
        // oncadeService.setCredentials('your-api-key', 'your-game-id');
        
        const success = await oncadeService.initialize();
        if (!isMounted) return;

        if (success) {
          console.log('Oncade SDK initialized successfully');
          setSdkInitialized(true);
          setIsConnected(true);
          setSdkError(null);
        } else {
          console.error('Failed to initialize Oncade SDK');
          setSdkError('Failed to initialize Oncade SDK. Check your API credentials.');
          setIsConnected(false);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error initializing Oncade SDK:', error);
        setSdkError('Error initializing Oncade SDK. Please try refreshing the page.');
        setIsConnected(false);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initOncadeSDK();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize SoundManager
  useEffect(() => {
    const soundManager = SoundManager.getInstance();
    
    // Initialize on user interaction to avoid autoplay restrictions
    const handleUserInteraction = () => {
      soundManager.init();
      
      // Apply settings to the sound manager
      soundManager.setSfxMute(!gameSettings.soundEnabled);
      soundManager.setMusicMute(!gameSettings.musicEnabled);
      soundManager.setSfxVolume(gameSettings.soundVolume || 1.0);
      soundManager.setMusicVolume(gameSettings.musicVolume || 0.8);
      
      // Remove event listeners once initialized
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    // Add event listeners for initialization
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);
  
  // Update SoundManager when settings change
  useEffect(() => {
    const soundManager = SoundManager.getInstance();
    soundManager.setSfxMute(!gameSettings.soundEnabled);
    soundManager.setMusicMute(!gameSettings.musicEnabled);
    soundManager.setSfxVolume(gameSettings.soundVolume || 1.0);
    soundManager.setMusicVolume(gameSettings.musicVolume || 0.8);
  }, [gameSettings]);

  // Initialize WebSocket connection
  useEffect(() => {
    // WebSocket connection will be initialized when entering the game
    return () => {
      // Clean up WebSocket connection if it exists
    };
  }, []);

  // Function to handle navigation between screens
  const navigateTo = (screen: string): void => {
    setCurrentScreen(screen);
  };

  // Function to handle settings update
  const handleSettingsUpdate = (newSettings: GameSettings): void => {
    setGameSettings(newSettings);
    navigateTo('mainMenu');
  };

  // Function to close the tip success modal
  const handleCloseTipModal = (): void => {
    setShowTipSuccessModal(false);
  };

  // Render the appropriate screen
  const renderScreen = (): JSX.Element => {
    if (isInitializing) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Initializing game...</p>
        </div>
      );
    }


    switch (currentScreen) {
      case 'game':
        return <Game onExit={() => navigateTo('mainMenu')} settings={gameSettings} />;
      case 'settings':
        return (
          <SettingsMenu
            settings={gameSettings}
            onSave={handleSettingsUpdate}
            onCancel={() => navigateTo('mainMenu')}
          />
        );
      case 'store':
        return <StoreMenu onBack={() => navigateTo('mainMenu')} />;
      case 'purchaseSuccess':
        return <PurchaseSuccess onBackToStore={() => navigateTo('store')} />;
      case 'mainMenu':
      default:
        return (
          <MainMenu
            onStartGame={() => navigateTo('game')}
            onOpenSettings={() => navigateTo('settings')}
            onOpenStore={() => navigateTo('store')}
            isConnected={isConnected}
            connectionError={connectionError}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderScreen()}
      {showTipSuccessModal && (
        <TipSuccessModal onClose={handleCloseTipModal} />
      )}
    </div>
  );
};

export default App; 