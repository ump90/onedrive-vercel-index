const { i18n } = require('./next-i18next.config')

module.exports = {
  i18n,
  reactStrictMode: true,
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true,
  // Ensure next-i18next config is bundled for serverless
  serverExternalPackages: [],
  outputFileTracingIncludes: {
    '/*': ['./next-i18next.config.js', './public/locales/**/*'],
  },
  // Exclude API routes from i18n locale routing
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite /en/api/* to /api/* (remove locale prefix from API routes)
        {
          source: '/:locale/api/:path*',
          destination: '/api/:path*',
          locale: false,
        },
      ],
    }
  },
}
