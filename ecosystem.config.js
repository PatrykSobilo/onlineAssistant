module.exports = {
  apps: [{
    name: 'onlineassistant',
    script: './server/src/app.js',
    cwd: '/var/www/onlineassistant',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    // Secrets are loaded from server/.env via dotenv in app.js
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
