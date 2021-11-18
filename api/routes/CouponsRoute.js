const Joi = require('joi');
const CouponsController = require('../controllers/CouponsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/coupons/{code}/valid',
      options: {
        auth: false,
        handler: CouponsController.validateCoupon,
        validate: {
          params: {
            code: Joi.string().required(),
          }
        },
        tags: ['api', 'coupons'],
        description: 'Validates coupon and if valid return the value of discount',
        notes: 'Gets value or percent of coupons by supplying coupon code return redeemable value or percent'
      }
    },
  ]);
};
