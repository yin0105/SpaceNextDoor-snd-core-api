'use strict';
const Reviews = require('../models/Reviews');
const Users = require('../models/Users');
const Boom = require('boom');
const sequelize = require('../../config/sequelize');
const controller = {};

controller.getReviews = function (request, h) {

  const id = request.params.id.split(',');

  const type = request.query.type;
  const minRating = request.query.min;
  const maxRating = request.query.max;
  const limit = request.query.limit;

  if(id.length == 1){

    //single id

    let condition = {};

    if(type == 'provider' || type == 'customer') {
      condition = {
        review_for: id,
        rating: {
          $and: {
            $gte: minRating,
            $lte: maxRating
          }
        },
      };
    }  else {
      condition = {
        order_id: id,
      };
    }

    return Reviews.findAll({
      where: condition,
      order: [['rating','DESC']],
      include: [
        {model: Users, as: 'reviewer', attributes: ['image', 'first_name', 'last_name', 'username']},
        {model: Users, as: 'user', attributes: ['image', 'first_name', 'last_name', 'username']}
      ],
      limit: limit,
    })
    .then((reviews) => {
      return h.response(reviews);
    })
    .catch((err) => {
      console.log(err);
      return Boom.internal(err);
    });

  } else {

    //multiple ids

    let condition = {};
    let group = [];

    if(type == 'provider' || type == 'customer' ) {
      condition = {
        review_for: {
          $or: id
        }
      };
      group = ['review_for'];
    } else {
      condition = {
        order_id: {
          $or: id
        }
      };
      group = ['order_id'];
    }

    const attributes = [
      'id', 'review_for', 'order_id',
      'review', 'created_at', 'updated_at',
      [sequelize.fn('MAX', sequelize.col('rating')), 'rating']
    ];

    return Reviews.findAll({
      attributes: attributes,
      where: condition,
      include: [
        {model: Users, as: 'reviewer', attributes: ['image', 'first_name', 'last_name', 'username']},
        {model: Users, as: 'user', attributes: ['image', 'first_name', 'last_name', 'username']}
      ],
      group: group,
    })
    .then((reviews) => {
      return h.response(reviews);
    })
    .catch((err) => {
      console.log(err);
      return Boom.internal(err);
    });

  }

};

module.exports = controller;
