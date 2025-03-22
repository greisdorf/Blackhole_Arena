// General types used across the application

// Game settings
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  graphicsQuality: 'low' | 'medium' | 'high';
  showFPS: boolean;
}

// Game state
export interface GameState {
  score: number;
  level: number;
  lives: number;
  clicks?: number; // Number of times the cube has been clicked
}

// Store item
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

// Oncade SDK Purchase Item
export interface PurchaseItem {
  _id?: string; // this is the item id that must be passed to getPurchaseURL
  type: string;
  name: string;
  description: string;
  price: number; // in cents
  imageUrl?: string;
  metadata?: Record<string, any>;
}

// WebSocket messages
export interface WsMessage {
  type: string;
  data?: any;
  gameState?: GameState; // Game state updates can be included in messages
}

// Scene manager
export interface SceneManager {
  update: (gameState: GameState) => void;
  getClickCount: () => number; // Method to get current click count
  getFPS: () => number; // Method to get current FPS
  dispose: () => void;
}

// WebSocket client
export interface WebSocketClient {
  sendJSON: (data: any) => void;
  sendBinary: (arrayBuffer: ArrayBuffer) => void;
  close: () => void;
} 