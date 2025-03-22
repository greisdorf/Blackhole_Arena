import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { GameSettings } from '../types';
import { SETTINGS_STORAGE_KEY } from '../utils/constants';

interface SettingsMenuProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onCancel: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onSave, onCancel }) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as GameSettings;
        setLocalSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse settings from localStorage:', error);
      }
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Handle different input types appropriately
    let newValue: any;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'range') {
      newValue = parseFloat(value);
    } else {
      newValue = value;
    }

    setLocalSettings({
      ...localSettings,
      [name]: newValue
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Save settings to localStorage
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(localSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
    
    onSave(localSettings);
  };

  // Reset settings to default
  const handleReset = () => {
    const defaultSettings: GameSettings = {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 1.0,
      musicVolume: 0.8,
      difficulty: 'normal',
      graphicsQuality: 'high',
      showFPS: false
    };
    
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="settings-menu">
      <div className="menu-container">
        <h2>Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="settings-group">
            <h3>Audio</h3>
            <div className="setting">
              <label>
                <input
                  type="checkbox"
                  name="soundEnabled"
                  checked={localSettings.soundEnabled}
                  onChange={handleChange}
                />
                Sound Effects
              </label>
            </div>
            {localSettings.soundEnabled && (
              <div className="setting slider-setting">
                <label>
                  Sound Volume:
                  <input
                    type="range"
                    name="soundVolume"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localSettings.soundVolume || 1.0}
                    onChange={handleChange}
                  />
                  <span>{Math.round((localSettings.soundVolume || 1.0) * 100)}%</span>
                </label>
              </div>
            )}
            <div className="setting">
              <label>
                <input
                  type="checkbox"
                  name="musicEnabled"
                  checked={localSettings.musicEnabled}
                  onChange={handleChange}
                />
                Music
              </label>
            </div>
            {localSettings.musicEnabled && (
              <div className="setting slider-setting">
                <label>
                  Music Volume:
                  <input
                    type="range"
                    name="musicVolume"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localSettings.musicVolume || 0.8}
                    onChange={handleChange}
                  />
                  <span>{Math.round((localSettings.musicVolume || 0.8) * 100)}%</span>
                </label>
              </div>
            )}
          </div>

          <div className="settings-group">
            <h3>Game</h3>
            <div className="setting">
              <label>
                Difficulty:
                <select
                  name="difficulty"
                  value={localSettings.difficulty}
                  onChange={handleChange}
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>Graphics</h3>
            <div className="setting">
              <label>
                Quality:
                <select
                  name="graphicsQuality"
                  value={localSettings.graphicsQuality}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="setting">
              <label>
                <input
                  type="checkbox"
                  name="showFPS"
                  checked={localSettings.showFPS}
                  onChange={handleChange}
                />
                Show FPS Counter
              </label>
            </div>
          </div>

          <div className="button-group">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="button" onClick={handleReset}>Reset to Default</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsMenu; 