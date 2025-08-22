module.exports = {
  apps: [{
    name: 'guiders-frontend-staging',
    // Usamos el bundle generado directamente
    script: './dist/guiders-20/server/server.mjs',
    cwd: '/var/www/guiders-frontend-staging',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'staging',
      PORT: 4001,
      PM2: 'true', // Bandera para forzar arranque en server.mjs (isMainModule bypass)
      LOG_LEVEL: 'info'
    },
    error_file: '/var/log/pm2/guiders-frontend-staging-error.log',
    out_file: '/var/log/pm2/guiders-frontend-staging-out.log',
    log_file: '/var/log/pm2/guiders-frontend-staging.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    instance_var: 'INSTANCE_ID'
  }]
};
