const Joi = require('joi');
const FavoriteImagesController = require('../controllers/FavoriteImagesController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/favorite/image/{image_id}',
      options: {
        auth: 'jwt',
        handler: FavoriteImagesController.favorite,
        validate: {
          params: {
            image_id: Joi.number().required()
          }
        },
        tags: ['api', 'favorite image'],
        description: 'Mark image favorite',
        notes: 'Mark image favorite'
      }
    },
    {
      method: 'DELETE',
      path: '/favorite/image/{image_id}',
      options: {
        auth: 'jwt',
        handler: FavoriteImagesController.unfavorite,
        validate: {
          params: {
            image_id: Joi.number().required()
          }
        },
        tags: ['api', 'unfavorite image'],
        description: 'Mark image unfavorite',
        notes: 'Mark image unfavorite'
      }
    },
    {
      method: 'GET',
      path: '/favorites/images',
      options: {
        auth: 'jwt',
        handler: FavoriteImagesController.getFavoriteImages,
        validate: {
          query: {
            page: Joi.number().default(0),
            limit: Joi.number().default(16),
          }
        },
        tags: ['api', 'favorite images'],
        description: 'Get my favorite images',
        notes: 'Get my favorite images'
      }
    }
  ]);
};
