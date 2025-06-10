// Configuración PM2 para Guiders Angular SSR
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'guiders-ssr',
    script: './dist/server/server.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    cwd: '/var/www/guiders',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOST: '0.0.0.0'
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_type: 'json',
    merge_logs: true,
    
    // Performance & Monitoring
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health check
    health_check_grace_period: 3000,
    
    // Advanced options
    node_args: [
      '--max-old-space-size=1024'
    ],
    
    // Clustering settings
    listen_timeout: 8000,
    kill_timeout: 5000,
    
    // Source maps support for better error tracking
    source_map_support: true
  }],
  
  // Deployment configuration (opcional)
  deploy: {
    production: {
      user: 'root',
      host: '10.8.0.1',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/guiders-frontend.git',
      path: '/var/www/guiders',
      'pre-deploy-local': '',
      'post-deploy': 'cd guiders-20 && npm ci && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
