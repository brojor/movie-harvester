module.exports = {
  apps: [
    {
      name: 'csfd-worker',
      script: './workers/csfd/index.js',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
    {
      name: 'rt-worker',
      script: './workers/rt/index.js',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
    {
      name: 'tmdb-worker',
      script: './workers/tmdb/index.js',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
    {
      name: 'webshare-worker',
      script: './workers/webshare/index.js',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
    // {
    //   name: 'warforum-indexer',
    //   script: './warforum-indexer/index.js',
    //   autorestart: false,
    //   env: {
    //     NODE_ENV: 'production',
    //     ENV_FILE: '/var/www/media-harvester/config/.env',
    //   },
    // },
    {
      name: 'download-manager',
      script: './download-manager/.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
        PORT: 3001,
      },
    },
    {
      name: 'movie-browser',
      script: './movie-browser/.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
        ENV_FILE: '/var/www/media-harvester/config/.env',
      },
    },
  ],
}
