module.exports = {
  apps: [
    {
      name: 'scraper',
      script: 'dist/orchestrator.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/movie-harvester/config/.env',
      },
    },
  ],
}
