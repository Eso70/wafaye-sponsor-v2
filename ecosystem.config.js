module.exports = {
  apps: [{
    name: 'wafaye-sponsor',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/wafaye-sponsor-v2',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    }
  }]
};
