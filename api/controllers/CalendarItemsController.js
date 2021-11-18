'use strict';
const Boom = require('boom');
const CalendarItems = require('../models/CalendarItems');
const controller = {};

controller.getAll = function (request, h) {
  const userId = request.isProvider ? request.userId : request.query.user_id;
  if (!userId) {
    return Boom.badRequest('User id is required');
  }
  const after = request.query.after;
  
  const filter = {
    user_id: userId
  };

  if (after) {
    filter.start = {
      $gte: after
    };
  }

  return CalendarItems.findAll({
    attributes: ['id', 'start', 'end', 'type'],
    where: filter
  })
  .then((items) => {
    return h.response(items);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.editItem = function (request, h) {
  if (!request.isProvider) {
    return Boom.forbidden('You are not allowed to view resource');
  }

  const item = request.payload;

  return CalendarItems
    .update(item, {where: {user_id: request.userId, id: request.params.id}})
    .then(() => {
      return h.response({success: true});
    })
    .catch((e) => {
      return Boom.internal(e);
    });
};

controller.createItem = function (request, h) {
  if (!request.isProvider) {
    return Boom.forbidden('You are not allowed to view resource');
  }

  const item = request.payload;
  item.user_id = request.userId;

  return CalendarItems
    .create(item)
    .then((item) => {
      return h.response(item);
    })
    .catch((e) => {
      return Boom.internal(e);
    });
};

controller.deleteItem = function (request, h) {
  const itemId = request.params.id;
  return CalendarItems.destroy({
    where: {
      user_id: request.userId,
      id: itemId
    },
    limit: 1
  })
  .then(() => {
    return h.response({success: true});
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;
