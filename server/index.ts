import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket, Data } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ 
  server, 
  path: '/socket' 
});

// Rate limiting middleware
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimit: Record<string, RateLimitRecord> = {};
const MAX_REQUESTS = 100;
const TIME_WINDOW = 60 * 1000; // 1 minute

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || '';
  
  if (!rateLimit[ip]) {
    rateLimit[ip] = {
      count: 0,
      resetTime: Date.now() + TIME_WINDOW
    };
  }

  if (Date.now() > rateLimit[ip].resetTime) {
    rateLimit[ip].count = 0;
    rateLimit[ip].resetTime = Date.now() + TIME_WINDOW;
  }

  rateLimit[ip].count++;

  if (rateLimit[ip].count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

// REST API endpoints
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// WebSocket server
interface ClientMessage {
  type: string;
  data?: any;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  // Handle binary messages
  ws.binaryType = 'arraybuffer';
  
  ws.on('message', (message: Data) => {
    try {
      if (message instanceof Buffer || message instanceof ArrayBuffer) {
        // Handle binary message
        // Example: Process game state updates
        console.log('Received binary message of length:', message.byteLength);
        
        // Echo back for testing
        ws.send(message);
      } else {
        // Handle text message
        const data: ClientMessage = JSON.parse(message.toString());
        console.log('Received:', data);
        
        // Echo back for testing
        ws.send(JSON.stringify({ 
          type: 'echo', 
          data: data 
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 