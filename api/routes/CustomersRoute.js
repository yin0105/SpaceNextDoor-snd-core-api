const Joi = require('joi');
const Controller = require('../controllers/CustomersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'PUT',
      path: '/customers',
      options: {
        auth: 'jwt',
        handler: Controller.updateCustomers,
        validate: {
          payload: {
            username: Joi.string().regex(/^[a-z0-9]+$/),
            first_name: Joi.string(),
            last_name: Joi.string(),
            cover: Joi.string(),
            image: Joi.string(),
            email: Joi.string().email(),
            phone_country_code: Joi.string(),
            phone: Joi.string(),
            longitude: Joi.string(),
            latitude: Joi.string(),
            languages: Joi.array().items(Joi.number()),
            locations: Joi.array().items({
              id: Joi.number(),
              location: Joi.string().required(),
              country: Joi.string(),
              lat: Joi.number(),
              long: Joi.number()
            }),
            customer: {
              favourite_providers: Joi.string()
            }
          }
        },
        tags: ['api', 'customers'],
        description: 'Update customer information of currently logged in user'
      }
    }
  ]);
};
