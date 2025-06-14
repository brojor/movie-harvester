module.exports = {
  apps: [
    {
      name: 'scraper',
      script: 'dist/orchestrator.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
