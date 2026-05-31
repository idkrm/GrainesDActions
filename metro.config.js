const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

//Ajout en-têtes HTTP de sécurité
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      //Protection contre le Clickjacking
      res.setHeader('X-Frame-Options', 'DENY');

      //Protection contre les failles XSS (Content Security Policy)
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' https://apis.google.com; connect-src 'self' https://*.firebaseio.com https://identitytoolkit.googleapis.com ws://localhost:* http://localhost:*; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
      );

      return middleware(req, res, next);
    };
  },
};

module.exports = config;