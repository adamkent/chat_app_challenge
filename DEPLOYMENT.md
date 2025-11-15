# Local Deployment Guide

Quick guide to run locally for testing.

## Prerequisites

- Node.js 18 and npm
- Docker and Docker Compose
- WSL2 (if on Windows)

## Setup Steps

### 1. Start Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and pgAdmin on port 5050.

### 2. Backend Setup
 
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Frontend Setup - Separate terminal

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 4. WSL2 Configuration (Windows Only)

If running in WSL2, find your WSL IP:

```bash
ip addr show eth0 | grep inet | awk '{print $2}' | cut -d/ -f1
```

Update `frontend/src/lib/trpc.ts` with your WSL IP:

```typescript
url: 'http://YOUR_WSL_IP:3001/trpc'
wsUrl: 'ws://YOUR_WSL_IP:3001/trpc'
```

## Test Accounts

Three seeded users are available:

- **adam** / password123
- **thomas** / password123  
- **clara** / password123

## Testing Real-time Messaging

1. Open two browser windows (use incognito for second user)
2. Log in as different users in each window
3. Create or open a conversation
4. Send messages - they should appear instantly in both windows

## Verify Services

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin)
- **Database**: localhost:5432 (postgres / postgres)

## Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running: `docker ps`
- Verify `.env` file exists in backend with `DATABASE_URL`

**Frontend can't connect:**
- Check backend is running on correct IP
- In WSL2, use WSL IP not localhost
- Check CORS settings allow `http://localhost:5173`

**WebSocket not connecting:**
- Verify backend logs show "WebSocket server ready"
- Check browser console for connection errors
- Ensure JWT token is being passed in connection params

## Stopping Services

```bash
# Stop frontend/backend
Ctrl+C in terminals

# Stop database
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```
