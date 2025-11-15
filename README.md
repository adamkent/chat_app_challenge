# Legora Chat

A real-time messaging application with end-to-end type-safe API communication.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Real-time/Streaming**: WebSocket subscriptions (tRPC)

## Project Structure

```
legora_chat/
├── backend/              # Node.js backend with tRPC API
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── trpc/        # tRPC router definitions
│   │   │   ├── routers/ # API endpoints (auth, thread, message)
│   │   │   ├── context.ts
│   │   │   └── trpc.ts
│   │   ├── utils/       # Auth utilities
│   │   └── server.ts    # Express server with tRPC middleware
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth context
│   │   ├── lib/         # tRPC client setup
│   │   └── pages/       # Login and messaging pages
│   └── package.json
└── docker-compose.yml   # PostgreSQL and pgAdmin services
```

## Backend Implementation

### Authentication
- JWT-based authentication with bcrypt password hashing
- Token stored in localStorage on frontend
- Protected routes require valid JWT token

### Database Schema
- **User**: id, username, passwordHash, createdAt
- **Thread**: id, createdAt (many-to-many with User via ThreadParticipant)
- **ThreadParticipant**: threadId, userId, joinedAt
- **Message**: id, threadId, userId, content, createdAt

### API Endpoints (tRPC)

#### Auth Router
- `auth.login` - Authenticate user and return JWT token

#### Thread Router
- `thread.list` - Get all threads for authenticated user
- `thread.create` - Create new thread with specified user
- `thread.get` - Get thread details with participants

#### Message Router
- `message.list` - Get all messages in a thread
- `message.create` - Send new message to thread
- `message.onNew` - WebSocket subscription for real-time messages

### Seeded Users

Three test users are available:
- Username: `adam` / Password: `password123`
- Username: `thomas` / Password: `password123`
- Username: `clara` / Password: `password123`

## WSL Development Notes


Note: This project uses `httpBatchLink` with `maxURLLength: 2083` to force POST requests for all tRPC queries. This is a quick workaround in WSL networking which avoids tRPC v11 batching issues with GET query parameters. 

Note: When developing on WSL2, the backend runs on the WSL IP address (e.g., `172.20.7.150:3001`) rather than `localhost`. The frontend is configured to connect to this IP address.

## Todo/Progress

- Backend API with tRPC
- PostgreSQL database with Prisma ORM
- JWT authentication
- User seeding
- Thread management (list, create)
- Message management (list, create)
- WebSocket subscription infrastructure
- Login page (frontend)
- Thread list display (frontend)
- Real-time message updates via WebSocket

## Coding Standards

- TSDoc comments for all functions and interfaces
- Explicit TypeScript types (no `any`)
- Consistent naming: camelCase for variables/functions, PascalCase for types/components
- Prettier for code formatting
- ESLint for code quality