module.exports = {
  apps: [
    {
      name: 'attiy-backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        FRONTEND_URL: 'https://aitiy.idro.co.uk',
        ADDITIONAL_FRONTEND_URL: 'https://aitiy.idro.co.uk',
        DATABASE_URL: 'postgresql://postgres:mysecretpassword@localhost:5432/ai_embed_platform',
        JWT_SECRET: '9HJj%31HBBegrn@VtU%@4*H7R!%f7nq%',
        COOKIE_SECRET: 'TPQTvLsQg@!jT4j$TuZZ$675Uu!XDrW5',
        JWT_EXPIRES_IN: '7d'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
};
