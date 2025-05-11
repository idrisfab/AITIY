module.exports = {
  apps: [
    {
      name: 'aitiy-frontend',
      script: '/root/AITIY/frontend/node_modules/.bin/next',
      args: 'start',
      cwd: '/root/AITIY/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: '/api',
        NEXT_PUBLIC_APP_URL: 'https://134.209.183.131',
        NEXT_PUBLIC_ENABLE_AUTH: 'true',
        NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
        NEXT_DISABLE_STATIC_GENERATION: 'true',
        USE_MOCK_DATA: 'false',
        API_BASE_URL: '/api',
        PATH: '/root/.local/share/fnm/node-versions/v24.0.0/installation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      }
    }
  ]
};
