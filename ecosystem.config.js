module.exports = {
  apps: [
    {
      name: 'oco-api',
      script: './backend/dist/main.js',
      cwd: '/home/alive75/code/oco',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: 5432,
        DATABASE_USERNAME: 'oco_user',
        DATABASE_PASSWORD: 'oco_password',
        DATABASE_NAME: 'oco_db',
        JWT_SECRET: 'your-super-secure-jwt-secret-key-here',
        JWT_EXPIRATION: '7d'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: 5432,
        DATABASE_USERNAME: 'oco_user',
        DATABASE_PASSWORD: 'oco_password',
        DATABASE_NAME: 'oco_db',
        JWT_SECRET: 'dev-jwt-secret-key',
        JWT_EXPIRATION: '7d'
      },
      // Logging configuration
      log_file: './logs/oco-api.log',
      out_file: './logs/oco-api-out.log',
      error_file: './logs/oco-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 3000,
      
      // Advanced PM2 features
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'dist'],
      merge_logs: true,
      autorestart: true,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Source map support for better error traces
      node_args: '--enable-source-maps'
    }
  ],
  
  deploy: {
    production: {
      user: 'deployer',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/oco.git',
      path: '/var/www/oco',
      'post-deploy': 'cd backend && npm install --production && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};