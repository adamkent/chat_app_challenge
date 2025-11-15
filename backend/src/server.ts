import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './trpc/routers/index.js';
import { createContext } from './trpc/context.js';

/**
 * Main Express application server with tRPC and WebSocket support.
 */
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// test login endpoint
app.post('/api/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { comparePassword, generateToken } = await import('./utils/auth.js');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username } });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// tRPC HTTP endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
});

// Set up WebSocket server for tRPC subscriptions
const wss = new WebSocketServer({
  server,
  path: '/trpc',
});

const wsHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    // For WebSocket connections, create a minimal context
    return {
      prisma,
      user: null,
      req: {} as any,
      res: {} as any,
    };
  },
});

console.log(`🔌 WebSocket server ready for subscriptions`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  wsHandler.broadcastReconnectNotification();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

wss.on('connection', (ws) => {
  console.log('➕ WebSocket client connected');
  
  ws.on('close', () => {
    console.log('➖ WebSocket client disconnected');
  });
});

export { app, server };
