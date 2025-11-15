# Legora Chat Backend

A real-time messaging backend built with Node.js, tRPC, Prisma, and PostgreSQL.

## Backend Tech Stack

Runtime: Node.js with TypeScript
API Framework: tRPC v11 (E2E type-safe API)
Database: PostgreSQL with Prisma ORM
Real-time/Streaming: WebSocket subscriptions via tRPC
Authentication: JWT with bcrypt password hashing
Validation: Zod schemas

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── server.ts          # Express + WebSocket server
│   ├── trpc/
│   │   ├── context.ts     # tRPC context with auth
│   │   ├── trpc.ts        # tRPC instance and procedures
│   │   └── routers/
│   │       ├── index.ts   # Main router
│   │       ├── auth.ts    # Authentication endpoints
│   │       ├── thread.ts  # Thread management
│   │       └── message.ts # Message CRUD + subscriptions
│   └── utils/
│       └── auth.ts        # JWT and bcrypt utilities
└── package.json
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)
- WSL2 (if on Windows)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install express cors zod jsonwebtoken bcryptjs ws @trpc/server @prisma/client superjson
npm install -D typescript ts-node-dev @types/node @types/express @types/ws @types/cors @types/bcryptjs @types/jsonwebtoken prisma
```

### 2. Environment Variables

Copy example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL` if needed. The default assumes PostgreSQL running on `localhost:5432`.

### 3. Start Database

Using Docker Compose (recommended):
```bash
# From the project root
docker-compose up -d postgres
```

### 4. Run Database Migrations

Generate Prisma client and run migrations:
```bash
npx prisma migrate dev --name init
```

Populate the database with test users (adam, thomas, clara):
```bash
npm run prisma:seed
```

**Test credentials:**
- Username: `adam`, `thomas`, or `clara`
- Password: `password123`

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` with:
- HTTP endpoint: `http://localhost:3001/trpc`
- WebSocket endpoint: `ws://localhost:3001/trpc`
- Health check: `http://localhost:3001/health`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with test data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Endpoints

### Auth

**`auth.login`** (mutation)
- Input: `{ username: string, password: string }`
- Returns: `{ token: string, user: { id: number, username: string } }`

### Threads

**`thread.list`** (query) - Protected
- Returns: Array of threads with other participant and last message

**`thread.create`** (mutation) - Protected
- Input: `{ otherUsername: string }`
- Returns: Created or existing thread

### Messages

**`message.list`** (query) - Protected
- Input: `{ threadId: number }`
- Returns: Array of messages in numerical order

**`message.create`** (mutation) - Protected
- Input: `{ threadId: number, content: string }`
- Returns: Created message

**`message.onNew`** (subscription) - Protected
- Input: `{ threadId: number }`
- Returns: Stream of new messages in real-time

## Database Schema

### Users
- `id` (PK)
- `username` (unique)
- `passwordHash`
- `createdAt`

### Threads
- `id` (PK)
- `createdAt`

### ThreadParticipants
- `id` (PK)
- `threadId` (FK)
- `userId` (FK)
- Unique constraint on `(threadId, userId)`

### Messages
- `id` (PK)
- `threadId` (FK)
- `senderId` (FK)
- `content`
- `createdAt`
- Index on `(threadId, createdAt)`

## Auth Flow

1. Client calls `auth.login` with username and password
2. Server validates credentials and returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Protected endpoints verify token and extract user from context

## Real-time Messaging/Streaming

Messages use WebSocket subscriptions:
1. Client subscribes to `message.onNew` for a specific thread
2. When any user sends a message via `message.create`, an event is emitted
3. All subscribed clients receive the new message in real-time
4. Implementation uses Node.js EventEmitter for pub/sub

## Security Considerations

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Protected endpoints verify user is a thread participant
- CORS configured for frontend origin
- Input validation with Zod schemas

## Development Notes

- SuperJSON transformer handles Date serialisation
- ES modules enabled (`"type": "module"`)
- Strict TypeScript configuration
- Access control: users can only view/send messages in their threads
- Duplicate thread prevention: creating thread with existing participant returns existing thread