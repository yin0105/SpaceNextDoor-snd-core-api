const ProviderCancellationPolicies = require('../models/ProviderCancellationPolicies');
const Boom = require('boom');

const controller = {};

controller.getAll = function (request, h) {
  return ProviderCancellationPolicies.findAll({
    attributes: {
      exclude: ['updated_at', 'created_at']
    },
  }).then((policies) => {
    return h.response(policies);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;