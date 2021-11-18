const PhotographyStyles = require('../models/PhotographyStyles');
const Boom = require('boom');

const controller = {};

controller.getAll = function (request, h) {
  return PhotographyStyles.findAll({
    attributes: ['id', 'name', 'slug'],
  }).then((styles) => {
    return h.response(styles);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;