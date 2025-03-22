require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server, 
  path: '/socket' 
});

// Rate limiting middleware
const rateLimit = {};
const MAX_REQUESTS = 100;
const TIME_WINDOW = 60 * 1000; // 1 minute

app.use((req, res, next) => {
  const ip = req.ip;
  
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
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// REST API endpoints
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket server
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle binary messages
  ws.binaryType = 'arraybuffer';
  
  ws.on('message', (message) => {
    try {
      if (message instanceof Buffer || message instanceof ArrayBuffer) {
        // Handle binary message
        // Example: Process game state updates
        console.log('Received binary message of length:', message.byteLength);
        
        // Echo back for testing
        ws.send(message);
      } else {
        // Handle text message
        const data = JSON.parse(message);
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