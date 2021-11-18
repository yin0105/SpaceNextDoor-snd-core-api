const Joi = require('joi');
const StripeController = require('../controllers/StripeController');

module.exports = (server, options) => {
  server.route([
    // get stripe charge details
    {
      method: 'GET',
      path: '/stripe/{charge_id}',
      options: {
        auth: 'jwt',
        handler: StripeController.getCharge,
        validate: {
          params: {
            charge_id: Joi.string().required()
          }
        },
        tags: ['api', 'stripe'],
        description: 'Get Stripe Charge Details',
        notes: 'Get Stripe Charge Details'
      }
    }
  ]);
};