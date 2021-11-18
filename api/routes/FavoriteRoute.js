const Joi = require('joi');
const FavoriteController = require('../controllers/FavoriteController');
const ProvidersController = require('../controllers/ProvidersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/favorite/{provider_id}',
      options: {
        auth: 'jwt',
        handler: FavoriteController.favorite,
        validate: {
          params: {
            provider_id: Joi.number().required()
          }
        },
        tags: ['api', 'favorite'],
        description: 'Mark provider favorite',
        notes: 'Mark provider favorite'
      }
    },
    {
      method: 'DELETE',
      path: '/favorite/{provider_id}',
      options: {
        auth: 'jwt',
        handler: FavoriteController.unfavorite,
        validate: {
          params: {
            provider_id: Joi.number().required()
          }
        },
        tags: ['api', 'unfavorite'],
        description: 'Mark provider unfavorite',
        notes: 'Mark provider unfavorite'
      }
    },
    {
      method: 'GET',
      path: '/favorites',
      options: {
        auth: 'jwt',
        handler: FavoriteController.getFavoriteProviders,
        validate: {
          query: {
            page: Joi.number().default(0),
            limit: Joi.number().default(16),
          }
        },
        tags: ['api', 'favorite'],
        description: 'Get my favorite providers',
        notes: 'Get my favorite providers'
      }
    }
  ]);
};
