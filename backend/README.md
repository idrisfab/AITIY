# Backend API

This is the backend API for the application, built with Express.js, TypeScript, and Prisma.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and update the environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Apply database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection URL
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration
- `SMTP_*` - Email configuration
- `FRONTEND_URL` - Frontend application URL
- `RATE_LIMIT_*` - Rate limiting configuration

## API Routes

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/teams` - Team management
- `/api/api-keys` - API key management 