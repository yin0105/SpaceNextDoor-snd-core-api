const Specialties = require('../models/Specialties');
const Boom = require('boom');

const controller = {};

controller.getAll = function (request, h) {
  return Specialties.findAll({
    attributes: ['id', 'name', 'slug'],
  }).then((specialties) => {
    return h.response(specialties);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;