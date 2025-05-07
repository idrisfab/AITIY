# Backend Deployment Guide

This guide provides instructions for deploying the ATTIY backend to a production environment.

## Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL database
- Environment variables properly configured

## Environment Variables

Make sure to set the following environment variables in your production environment:

```
# Database Configuration
DATABASE_URL=postgresql://postgres:password@hostname:5432/ai_embed_platform

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# Email Configuration (if using email features)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@yourapp.com

# API Keys for AI services
ANTHROPIC_API_KEY=your-api-key-here
PERPLEXITY_API_KEY=pplx-abcde

# AI Model Configuration
MODEL=claude-3-7-sonnet-20250219
PERPLEXITY_MODEL=sonar-pro
MAX_TOKENS=64000
TEMPERATURE=0.2

# CORS Configuration
CORS_ORIGIN=https://aitiy-fab.windsurf.build
```

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

### 2. Database Migration

```bash
npm run prisma:migrate
```

### 3. Start the Application

```bash
npm start
```

## Deployment Platforms

### Heroku

1. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Add PostgreSQL add-on:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret
   # Add other environment variables as needed
   ```

4. Deploy the application:
   ```bash
   git push heroku main
   ```

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a PostgreSQL database service
4. Configure environment variables in the Railway dashboard
5. Deploy your application

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the build command: `npm install && npm run build`
4. Set the start command: `npm start`
5. Add a PostgreSQL database service
6. Configure environment variables in the Render dashboard

## Frontend Configuration

After deploying your backend, update your frontend environment variables to point to your new backend URL:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

## Database Considerations

For production, consider:
1. Regular database backups
2. Connection pooling for better performance
3. Database scaling as your application grows
