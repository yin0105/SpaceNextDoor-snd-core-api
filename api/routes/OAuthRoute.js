const Controller = require('../controllers/OAuthController');
const Joi = require('joi');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/auth/oauth/facebook',
      options: {
        auth: 'facebook',
        handler: Controller.authWithFacebook,
        validate: {
          query: {
            is_provider: Joi.bool().default(false),
            returnUrl: Joi.string(),
            code: Joi.string(),
            state: Joi.string()
          }
        },
        tags: ['api', 'oauth'],
        description: 'Authenticate users using facebook',
        notes: 'It will be used for logging in and signing up. Both has same endpoint, the api ' +
                'will automatically check and return the jwt to authorize the user.'
      }
    },
  ]);
};
