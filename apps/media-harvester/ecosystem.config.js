module.exports = {
  apps: [
    {
      name: 'media-harvester',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
  ],
}
