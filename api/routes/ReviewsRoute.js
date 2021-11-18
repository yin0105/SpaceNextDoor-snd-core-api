const Joi = require('joi');
const Controller = require('../controllers/ReviewsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/reviews/{id}',
      options: {
        auth: false,
        handler: Controller.getReviews,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9,]+$/).required(),
          },
          query: {
            type: Joi.string().valid(['provider', 'customer', 'order']).default('provider'),
            min: Joi.number().integer().min(0).max(5).default(0),
            max: Joi.number().integer().min(0).max(5).default(5),
            limit: Joi.number().integer(),
          }
        },
        tags: ['api', 'reviews'],
        description: 'Gets reviews for a specific ID or ID array of provider,customer or order',
        notes: 'Gets reviews for a specific ID or ID array of provider,customer or order'
      }
    }
  ]);
};
