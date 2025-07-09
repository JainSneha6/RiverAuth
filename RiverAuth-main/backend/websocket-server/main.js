const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  console.log('🔌  New client connected', req.socket.remoteAddress);

  ws.on('message', (msg) => {
    console.log('📨  Received:', msg.toString());
    ws.send(`You said → ${msg}`);
  });

  ws.on('close', () => console.log('👋  Client disconnected'));
});

console.log('✅  WebSocket server up at ws://localhost:8080');
