const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajout en-têtes HTTP de sécurité pour le serveur de dev Metro
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Protection contre le Clickjacking
      res.setHeader('X-Frame-Options', 'DENY');

      // Protection contre les failles XSS (Content Security Policy)
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' https://apis.google.com; " +
        "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:;"
      );

      return middleware(req, res, next);
    };
  },
};

module.exports = config;