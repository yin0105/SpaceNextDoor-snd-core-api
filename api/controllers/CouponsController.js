const Coupons = require('../models/Coupons');
const CouponUses = require('../models/CouponUses');
const Boom = require('boom');

const controller = {};

controller.validateCoupon = function (request, h) {

  const couponCode = request.params.code;

  return Coupons
    .findOne({
      where: {code: couponCode}
    })
    .then((coupon) => {
      if(!coupon){
        //return nothing
        return Boom.notFound('Coupon not found!');
      }
      
      //check coupon redemption
      return CouponUses
        .find({
          where: {coupon_id: coupon.id}
        })
        .then((couponUses) => {
          if(!couponUses){
            //check expiration
            const expireDate = new Date(coupon.expired).valueOf();
            const dateNow = Date.now();
            if(dateNow > expireDate){
              return h.response({error: true, message: 'This coupon has been expired!'});
            } else {
              return h.response({
                success:true,
                value_percent: coupon.value_percent,
                value_fixed: coupon.value_fixed
              });
            }
          } else {
            //coupon already redeem
            return h.response({error: true, message: 'This coupon has been redeemed!'});
          }
        })
        .catch((error) => {
          return Boom.internal(error);
        });
    })
  .catch((error) => {
    return Boom.internal(error);
  });
};

module.exports = controller;