# AITIY - AI Chat Embed Platform

![AITIY Logo](https://via.placeholder.com/200x100?text=AITIY)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
  - [Development Setup](#development-setup)
  - [Production Deployment](#production-deployment)
    - [NGINX Deployment](#nginx-deployment)
    - [Apache Deployment](#apache-deployment)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Analytics Dashboard](#analytics-dashboard)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

## Overview

AITIY is a powerful AI chat embed platform developed by Fab Soft (founded by Idris Fabiyi) that allows businesses to integrate AI-powered chat capabilities into their websites and applications. The platform supports multiple AI providers including OpenAI, Anthropic, Google Gemini, and Grok, providing flexible options for AI-powered conversations.

The platform features a user-friendly dashboard for managing chat embeds, comprehensive analytics for tracking user interactions, and customizable chat widgets that can be easily integrated into any website.

## Features

- **Multi-vendor AI Support**: Integrate with OpenAI, Anthropic, Google Gemini, and Grok
- **Customizable Chat Widgets**: Tailor the appearance and behavior of chat embeds
- **Team Management**: Collaborate with team members on chat configurations
- **Detailed Analytics**: Track conversation metrics and user engagement
- **API Key Management**: Securely store and manage API keys for different vendors
- **Responsive Design**: Chat widgets work seamlessly on desktop and mobile devices
- **Theme Customization**: Light, dark, and system theme options
- **Position Control**: Place chat widgets in different corners of the screen
- **System Prompts**: Configure custom system prompts for AI models

## System Requirements

### Backend
- Node.js 14.x or higher
- PostgreSQL 13.x or higher
- 2GB RAM minimum (4GB recommended)
- 10GB storage space

### Frontend
- Node.js 14.x or higher
- 1GB RAM minimum
- 5GB storage space

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/AITIY.git
   cd AITIY
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Set up the database**
   ```bash
   cd ../backend
   npx prisma migrate dev
   ```

5. **Start development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend server (in a new terminal)
   cd frontend
   npm run dev
   ```

### Production Deployment

#### NGINX Deployment

1. **Build the application**
   ```bash
   # Build backend
   cd backend
   npm run build
   
   # Build frontend
   cd ../frontend
   npm run build
   ```

2. **Set up NGINX configuration**
   Create a new NGINX configuration file:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$host$request_uri;
   }
   
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
       
       # Frontend
       location / {
           root /path/to/AITIY/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # API Documentation
       location /api-docs {
           proxy_pass http://localhost:3001/api-docs;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Set up process management with PM2**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the backend server
   cd backend
   pm2 start dist/server.js --name attiy-backend
   
   # Save PM2 configuration
   pm2 save
   
   # Set up PM2 to start on system boot
   pm2 startup
   ```

4. **Enable and restart NGINX**
   ```bash
   sudo ln -s /etc/nginx/sites-available/attiy.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Apache Deployment

1. **Build the application**
   ```bash
   # Build backend
   cd backend
   npm run build
   
   # Build frontend
   cd ../frontend
   npm run build
   ```

2. **Set up Apache configuration**
   Create a new Apache configuration file:
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       Redirect permanent / https://your-domain.com/
   </VirtualHost>
   
   <VirtualHost *:443>
       ServerName your-domain.com
       DocumentRoot /path/to/AITIY/frontend/dist
       
       SSLEngine on
       SSLCertificateFile /path/to/certificate.crt
       SSLCertificateKeyFile /path/to/private.key
       
       <Directory /path/to/AITIY/frontend/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       # Frontend SPA routing
       <IfModule mod_rewrite.c>
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </IfModule>
       
       # Backend API proxy
       ProxyRequests Off
       ProxyPreserveHost On
       ProxyVia Full
       
       <Location /api>
           ProxyPass http://localhost:3001/api
           ProxyPassReverse http://localhost:3001/api
       </Location>
       
       # API Documentation proxy
       <Location /api-docs>
           ProxyPass http://localhost:3001/api-docs
           ProxyPassReverse http://localhost:3001/api-docs
       </Location>
       
       ErrorLog ${APACHE_LOG_DIR}/attiy-error.log
       CustomLog ${APACHE_LOG_DIR}/attiy-access.log combined
   </VirtualHost>
   ```

3. **Set up process management with PM2**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the backend server
   cd backend
   pm2 start dist/server.js --name attiy-backend
   
   # Save PM2 configuration
   pm2 save
   
   # Set up PM2 to start on system boot
   pm2 startup
   ```

4. **Enable required Apache modules and restart**
   ```bash
   sudo a2enmod ssl proxy proxy_http rewrite
   sudo a2ensite attiy.conf
   sudo systemctl restart apache2
   ```

## Architecture

AITIY is built with a modern tech stack:

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **API Documentation**: Swagger/OpenAPI

The application follows a client-server architecture with RESTful API endpoints for communication between the frontend and backend.

## API Documentation

AITIY provides comprehensive API documentation using Swagger/OpenAPI. The documentation is available at:

```
https://your-domain.com/api-docs
```

or during development at:

```
http://localhost:3001/api-docs
```

The API documentation includes:

- Authentication endpoints
- User management
- Team management
- Chat embed configuration
- Analytics endpoints
- Proxy routes for AI vendors

### API Authentication

Most API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Analytics Dashboard

AITIY includes a powerful analytics dashboard that provides insights into chat interactions:

- Conversation volume over time
- Message counts per conversation
- Token usage statistics
- User engagement metrics
- Common topics and questions

The analytics dashboard is accessible from the main navigation menu and allows filtering by:

- Time period (daily, weekly, monthly)
- Date range
- Specific chat embeds

## Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

**Backend (.env file)**
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/attiy

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h

# CORS
FRONTEND_URL=http://localhost:3000

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@example.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (.env file)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database user has proper permissions

2. **API Key Issues**
   - Verify API keys are correctly entered
   - Check for rate limiting on vendor side
   - Ensure proper permissions are set for the API keys

3. **CORS Errors**
   - Verify FRONTEND_URL in backend .env matches your frontend URL
   - Check that credentials: true is set in CORS configuration

4. **JWT Authentication Failures**
   - Ensure JWT_SECRET is properly set
   - Check token expiration time

## Support

For technical support, please contact:

Idris Fabiyi  
Fab Soft  
Email: support@fabsoft.com  
Website: https://fabsoft.com

## License

© 2025 Fab Soft. All rights reserved.

---

*This documentation was last updated on May 5, 2025.*
