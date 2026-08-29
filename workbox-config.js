module.exports = {
  globDirectory: 'artifacts/mobile/dist/',
  globPatterns: [
    '**/*.js',
    '**/*.css',
    '**/*.html',
    '**/*.json',
    '**/*.png',
    '**/*.ico',
    '**/*.woff',
    '**/*.woff2',
  ],
  globIgnores: ['**/node_modules/**'],
  swDest: 'artifacts/mobile/dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
};
