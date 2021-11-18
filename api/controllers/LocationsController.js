const Locations = require('../models/Locations');
const Boom = require('boom');

const controller = {};

controller.getAll = function (request, h) {
  return Locations.findAll({
    attributes: ['id','title','key'],
  }).then((locations) => {
    return h.response(locations);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;
