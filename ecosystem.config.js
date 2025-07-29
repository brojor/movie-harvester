module.exports = {
  apps: [
    {
      name: 'csfd-worker',
      script: './csfd-worker/index.js',
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'rt-worker',
      script: './rt-worker/index.js',
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'tmdb-worker',
      script: './tmdb-worker/index.js',
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'webshare-worker',
      script: './webshare-worker/index.js',
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'warforum-indexer',
      script: './warforum-indexer/index.js',
      autorestart: false,
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'movie-browser',
      script: './movie-browser/server/index.mjs',
      env: {
        ENV_FILE: './.env',
      },
    },
    {
      name: 'download-manager',
      script: './download-manager/server/index.mjs',
      env: {
        ENV_FILE: './.env',
        PORT: 3001,
      },
    },
  ],
}
