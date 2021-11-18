'use strict';
const Boom = require('boom');
const StripeService = require('../services/StripeService');
const controller = {};

controller.getCharge = async (request, h) => {
  if (!request.isAdmin){
    return Boom.forbidden();
  }
  try {
    return await StripeService.getCharge(request.params.charge_id);
  } catch (err) {
    throw Boom.internal(err);
  }
};

module.exports = controller;
