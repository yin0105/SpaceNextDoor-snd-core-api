const AuthMiddleware = require('./AuthMiddleware');
const SocialOAuthMiddleware = require('./SocialOAuthMiddleware');

exports.plugin = {
  register: (server, options) => {
    // Register all middlewares
    AuthMiddleware(server, options);
    SocialOAuthMiddleware(server, options);
  },
  name: 'middlware'
};
