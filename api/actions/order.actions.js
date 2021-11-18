const to = require('await-to-js').to;
const Boom = require('boom');
const Coupons = require('../models/Coupons');
const CouponUses = require('../models/CouponUses');
const Users = require('../models/Users');
const Locations = require('../models/Locations');
const Providers = require('../models/Providers');
const ProviderAddOns = require('../models/ProviderAddOns');

const validateCoupon = async (code) => {
  const [err, couponObj] = await to(Coupons.findOne({where: {code}}));
  
  if(err) {
    console.log(err);
    throw Boom.internal(err)
  }
  if(!couponObj) {
    throw Boom.notFound('Coupon not found!');
  }
  
  //check coupon redemption
  const [readError, couponUses] = await to(CouponUses.find({where: {coupon_id: couponObj.id}}));
  
  if(readError) {
    console.log(err);
    throw Boom.internal(readError)
  }

  if (couponUses) {
    //coupon already redeemed
    throw {error: true, message: 'This coupon has been redeemed!'};
  }

  //check expiration
  const expireDate = new Date(couponObj.expired).valueOf();
  const dateNow = Date.now();

  if(dateNow > expireDate) {
    throw {error: true, message: 'This coupon has been expired!'};
  }
  return couponObj;
}

const validateProvider = async (id) => {
  const [err, user] = await to(
    Users.findOne({
      attributes: ['id', 'first_name', 'last_name', 'provider_id', 'email'],
      where: {id},
      include: [{model: Providers, as: 'provider', attributes: ['id', 'hourly_rate']}]
    })
  );

  if (err) {
    throw Boom.internal(err)
  }

  if (!user) {
    throw Boom.notFound('Provider not found');
  }
  return user;
}

const validateCustomer = async (id) => {
  const [err, user] = await to(
    Users.findOne({
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone_country_code', 'phone'],
      where: {id}
    })
  );

  if (err) {
    throw Boom.internal(err)
  }

  if (!user) {
    throw Boom.notFound('Customer not found');
  }
  return user;
}

const validateLocations = async (id) => {
  const [err, location] = await to(Locations.findOne({where: {id}}))

  if (err) {
    throw Boom.internal(err)
  }
  if (!location) {
    throw Boom.notFound('Location not found');
  }

  return location
}

const validateAddOns = async (providerId, addonIds) => {
  const [err, addonsResult] = await to(
    ProviderAddOns.findAll({
      where: {
        provider_id: providerId,
        id: {
          $or: addonIds
        }
      }
    })
  );

  if (err) {
    throw Boom.internal(err)
  }

  if (addonsResult.length != addonIds.length) {
    throw Boom.notFound('One of the addons not found');
  }
  return addonsResult;
}

const fakePromise = () => new Promise((resolve) => resolve());

module.exports = {
  validateCoupon,
  validateProvider,
  validateLocations,
  validateCustomer,
  validateAddOns,
  fakePromise
}