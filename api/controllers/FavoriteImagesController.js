'use strict';
const FavoriteImages = require('../models/FavoriteImages');
const Users = require('../models/Users');
const ProviderPortfolioImages = require('../models/ProviderPortfolioImages');
const Specialties = require('../models/Specialties');
const async = require('async');
const Boom = require('boom');
const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const controller = {};

controller.favorite = function (request, h) {
  if (!request.isCustomer) return Boom.forbidden();

  const userId = request.userId;
  const image_id = request.params.image_id;

  return ProviderPortfolioImages.findOne({
    where: {
      id: image_id
    }
  })
  .then((Image) => {
    if (!Image) {
      return Boom.notFound('Image not found');
    }

    return FavoriteImages.findOrCreate({
      where: {
        user_id: userId,
        image_id: image_id
      }
    })
    .spread(() => {
      return h.response({success:true});
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.unfavorite = function (request, h) {
  if (!request.isCustomer) return Boom.forbidden();

  const userId = request.userId;
  const image_id = request.params.image_id;

  return FavoriteImages.destroy({
    where: {
      user_id: userId,
      image_id: image_id
    },
    limit: 1
  })
  .then(() => {
    return h.response({success:true});
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.getFavoriteImages = function (request, h) {
  if (!request.isCustomer) return Boom.forbidden();
  
  const userId = request.userId;
  const page = request.query.page;
  const limit = request.query.limit;

  return sequelize.query(`
    SELECT u.id, u.username,
      u.first_name, u.image as imageFile, u.cover, u.last_name, provider.title, provider.is_featured,
      provider.hourly_rate as price,
      (
        select group_concat(loc.key) from ws_users_locations as u_loc 
        left join locations as loc
        on u_loc.location_id = loc.id
        where u_loc.user_id = u.id
        ) as city,
      IFNULL((SELECT ROUND(AVG(rt.rating),2) FROM ws_reviews as rt WHERE rt.review_for = u.id), 0) as rating,
      pf.link AS favorite_image_link, f.image_id AS favorite_image_id
    FROM ws_favorite_images as f
    LEFT JOIN ws_portfolio_images as pf
      ON pf.id = f.image_id
    LEFT JOIN ws_users as u
      ON u.id = pf.user_id
    LEFT JOIN ws_providers as provider
      ON u.provider_id = provider.id
    WHERE u.is_active = 1 AND u.status = 1 AND f.user_id = ${userId}
    ORDER BY f.id DESC
    LIMIT ${limit} OFFSET ${page*limit}`
  ).then(providers => {
    return sequelize.query(`
      SELECT count(*) as count 
      FROM ws_favorite_images as f
      LEFT JOIN ws_portfolio_images as pf
        ON pf.id = f.image_id
      LEFT JOIN ws_users as u
        ON u.id = pf.user_id
      LEFT JOIN ws_providers as provider
        ON u.provider_id = provider.id
      WHERE u.is_active = 1 AND u.status = 1 AND f.user_id = ${userId}
    `).then((countedData) => {
      providers[0] = providers[0].map((provider, index) => {
        provider.images = [{
          link: provider.favorite_image_link,
          id: provider.favorite_image_id,
          is_favorite: 1,
          tags: []
        }];
        return provider;
      });

      return h.response({
        data: providers[0],
        paging: {
          total: countedData[0][0].count
        }
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

module.exports = controller;
