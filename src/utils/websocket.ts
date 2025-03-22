import { WebSocketClient, WsMessage } from '../types';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;

// WebSocket connection utility
export const setupWebSocketConnection = (
  onMessage: MessageHandler, 
  onError?: ErrorHandler
): WebSocketClient => {
  // Determine the WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = process.env.NODE_ENV === 'production' ? window.location.port : '8080';
  const wsUrl = `${protocol}//${host}:${port}/socket`;
  
  // Create WebSocket connection
  const socket = new WebSocket(wsUrl);
  
  // Binary type for efficient data transfer
  socket.binaryType = 'arraybuffer';
  
  // Connection opened
  socket.addEventListener('open', (_event: Event) => {
    console.log('Connected to game server');
    
    // Send initial message to identify the client
    socket.send(JSON.stringify({
      type: 'connect',
      data: {
        clientId: generateClientId(),
        timestamp: Date.now()
      }
    }));
  });
  
  // Listen for messages
  socket.addEventListener('message', (event: MessageEvent) => {
    try {
      if (event.data instanceof ArrayBuffer) {
        // Handle binary message (game state updates)
        const view = new DataView(event.data);
        
        // Example binary message processing
        // This would be more complex in a real game
        const messageType = view.getUint8(0);
        
        switch (messageType) {
          case 0: // Game state update
            // Parse binary data into game state
            const gameState = parseBinaryGameState(view);
            onMessage({ gameState });
            break;
          default:
            console.warn('Unknown binary message type:', messageType);
        }
      } else {
        // Handle JSON message
        const message: WsMessage = JSON.parse(event.data);
        onMessage(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error processing message'));
      }
    }
  });
  
  // Connection closed
  socket.addEventListener('close', (event: CloseEvent) => {
    console.log('Disconnected from game server:', event.code, event.reason);
    if (event.code !== 1000) {
      // Abnormal closure
      if (onError) {
        onError(new Error(`Connection closed abnormally. Code: ${event.code}`));
      }
    }
  });
  
  // Connection error
  socket.addEventListener('error', (event: Event) => {
    console.error('WebSocket error:', event);
    if (onError) {
      onError(new Error('WebSocket connection error'));
    }
  });
  
  // Return socket with additional methods
  return {
    // Send JSON data
    sendJSON: (data: any): void => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      } else {
        console.warn('Cannot send message, socket is not open');
      }
    },
    
    // Send binary data for efficient game state updates
    sendBinary: (arrayBuffer: ArrayBuffer): void => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(arrayBuffer);
      } else {
        console.warn('Cannot send binary message, socket is not open');
      }
    },
    
    // Close the connection
    close: (): void => {
      socket.close(1000, 'Client disconnecting');
    }
  };
};

// Generate a random client ID
const generateClientId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Parse binary game state
// This is a placeholder for a more complex implementation
const parseBinaryGameState = (dataView: DataView) => {
  // In a real implementation, this would decode the binary format
  // based on a protocol designed for the game
  
  // Example simple parser:
  const score = dataView.getUint32(1, true);
  const level = dataView.getUint8(5);
  const lives = dataView.getUint8(6);
  const clicks = dataView.getUint32(7, true);
  
  return { score, level, lives, clicks };
}; 