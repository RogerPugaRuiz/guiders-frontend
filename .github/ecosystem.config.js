// Configuración PM2 para Guiders Angular SSR
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'guiders-ssr',
    script: './dist/guiders-20/server/server.mjs',
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
    source_map_support: true,
    
    // Startup options
    wait_ready: true,
    listen_timeout: 10000
  }]
};
