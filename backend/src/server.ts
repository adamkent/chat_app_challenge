import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './trpc/routers/index.js';
import { createContext } from './trpc/context.js';
import { verifyToken } from './utils/auth.js';

/**
 * Main Express application server with tRPC and WebSocket support.
 */
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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

// Debug endpoint
app.post('/debug', (req, res) => {
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  res.json({ received: req.body });
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
  verifyClient: (info) => {
    // Allow all origins for development
    console.log('WebSocket verify client:', info.origin);
    return true;
  },
});

const wsHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: async (opts: any) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('WebSocket connection attempt:', {
      hasReq: !!opts.req,
      hasInfo: !!opts.info,
      connectionParams: opts.info?.connectionParams,
    });
    
    // Extract JWT from WebSocket connection params
    let user = null;
    const connectionParams = opts.info?.connectionParams;
    const token = connectionParams?.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        user = decoded;
        console.log('WebSocket authenticated:', user.username);
      } catch (error) {
        console.error('WebSocket auth failed:', error);
      }
    } else {
      console.log('No token in WebSocket connection');
    }
    
    return {
      prisma,
      user,
      req: opts.req as any,
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
