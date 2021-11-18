const BlockedWords = require('../models/BlockedWords');
const Boom = require('boom');

const controller = {};

controller.getAll = function (request, h) {
  return BlockedWords.findAll({
    attributes: ['word'],
  }).then((words) => {
    return h.response(words.map(obj => obj.word));
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;