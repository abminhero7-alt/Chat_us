# Chat US App

A modern, scalable messaging application for mobile and web with end-to-end encryption, real-time messaging, voice/video calls, and more.

## Features

- **Authentication**: Email, phone, social logins (Google, Facebook), 2FA
- **Messaging**: 1:1 and group chats, rich media, reactions, editing, deletion
- **Real-time**: WebSocket-based messaging with typing indicators, read receipts
- **Calls**: Voice and video calls via WebRTC
- **Status**: 24-hour expiring stories (text, image, video)
- **Organization**: Pin, archive, mute, star messages, search
- **Security**: End-to-end encryption, block/report users, privacy settings
- **Themes**: Light/dark mode, custom chat backgrounds
- **Cross-platform**: Responsive web app, ready for mobile wrapping

## Tech Stack

### Backend
- **Runtime**: Node.js with Express
- **Real-time**: Socket.IO
- **Database**: SQLite (via Prisma ORM) - easily switchable to PostgreSQL
- **Storage**: Cloudinary for media uploads
- **Auth**: JWT tokens with refresh token rotation
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TailwindCSS
- **State**: Zustand
- **Real-time**: Socket.IO Client
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env

# Initialize database
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development servers
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`

### Demo Accounts

All accounts use password: `Password123!`

| Email | Role |
|-------|------|
| alice@example.com | User |
| bob@example.com | User |
| charlie@example.com | User |
| diana@example.com | User |
| eve@example.com | User |
| frank@example.com | User |
| admin@example.com | Admin |

## Project Structure

```
Chat US-app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/          # Database, logger, cloudinary
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── routes/          # API routes
│   │   ├── sockets/         # WebSocket handlers
│   │   └── utils/           # JWT helpers
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data
│   └── uploads/             # Temp upload directory
├── frontend/                # Next.js web app
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   ├── store/           # Zustand stores
│   │   ├── lib/             # API client, socket
│   │   └── utils/           # Helpers
│   └── public/              # Static assets
├── shared/                  # Shared types & constants
│   └── src/
│       ├── types/           # TypeScript interfaces
│       ├── constants/       # App constants
│       └── utils/           # Shared utilities
└── docs/
    └── API.md               # API documentation
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## Deployment

### Backend (Railway/Render/Heroku)

```bash
# Build
cd backend && npm run build

# Set environment variables
# DATABASE_URL (PostgreSQL URL)
# JWT_SECRET, JWT_REFRESH_SECRET
# CLOUDINARY_* credentials
# SMTP_* for email

# Start
npm start
```

### Frontend (Vercel/Netlify)

```bash
# Build
cd frontend && npm run build

# Set environment variables
# API_URL=https://your-backend-url.com/api
# WS_URL=https://your-backend-url.com

# Deploy to Vercel
vercel --prod
```

### Docker

```bash
# Build and run with docker-compose
docker-compose up -d
```

## Environment Variables

See `backend/.env.example` for all required variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run build` | Build all packages |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Lint all packages |

## License

MIT
