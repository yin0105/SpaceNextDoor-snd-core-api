'use strict';
const Boom = require('boom');
const XeroService = require('../services/XeroService');
const controller = {};

controller.getAccounts = async (request, h) => {
  if (!request.isAdmin){
    return Boom.forbidden();
  }
  try {
    return await XeroService.getAccounts();
  } catch (err) {
    throw Boom.internal(err);
  }
};

module.exports = controller;
