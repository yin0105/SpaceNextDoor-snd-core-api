'use strict';
const FavoriteProviders = require('../models/FavoriteProviders');
const Users = require('../models/Users');
const ProviderPortfolioImages = require('../models/ProviderPortfolioImages');
const Specialties = require('../models/Specialties');
const async = require('async');
const promisify = require('../services/Helpers').promisify;
const Boom = require('boom');
const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const controller = {};

controller.favorite = function (request, h) {
  if (!request.isCustomer) return Boom.forbidden();

  const userId = request.userId;
  const provider_id = request.params.provider_id;

  if (userId === provider_id) { //user cannot favorite himself
    return Boom.forbidden();
  }

  return Users.findOne({
    where: {
      id: provider_id,
      provider_id: {
        [Op.ne]: null
      },
      is_active: 1,
      status: 1
    }
  })
  .then((Provider) => {
    if (!Provider) {
      return Boom.notFound('Provider not found');
    }

    return FavoriteProviders.findOrCreate({
      where: {
        user_id: userId,
        favorited: provider_id
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
  const provider_id = request.params.provider_id;

  if (userId === provider_id) {
    return Boom.forbidden();
  }

  return FavoriteProviders.destroy({
    where: {
      user_id: userId,
      favorited: provider_id
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

controller.getFavoriteProviders = function (request, h) {
  if (!request.isCustomer) return Boom.forbidden();
  
  const userId = request.userId;
  const page = request.query.page;
  const limit = request.query.limit;

  return sequelize.query(`
    SELECT u.id, u.username,
      u.first_name, u.image as imageFile, u.cover, u.last_name, provider.title, provider.is_featured,
      provider.hourly_rate as price, GROUP_CONCAT(s.slug) as specialty_slug,
      (
        select group_concat(loc.key) from ws_users_locations as u_loc 
        left join locations as loc
        on u_loc.location_id = loc.id
        where u_loc.user_id = u.id
        ) as city,
      GROUP_CONCAT(s.name) as specialty,
      IFNULL((SELECT ROUND(AVG(rt.rating),2) FROM ws_reviews as rt WHERE rt.review_for = u.id), 0) as rating, 1 as is_favorite
    FROM ws_favorite_providers as f
    LEFT JOIN ws_users as u
      ON u.id = f.favorited
    LEFT JOIN ws_providers as provider
      ON u.provider_id = provider.id
    LEFT JOIN specialty as s
      ON FIND_IN_SET(s.id, provider.specialty)
    WHERE u.is_active = 1 AND u.status = 1 AND f.user_id = ${userId}
    GROUP BY u.id
    ORDER BY case provider.is_featured when 1 then 1 else 2 end, f.id DESC
    LIMIT ${limit} OFFSET ${page*limit}`
  ).then(providers => {
    return sequelize.query(`
      SELECT count(*) as count 
      FROM ws_favorite_providers as f
      LEFT JOIN ws_users as u
      ON u.id = f.favorited
      WHERE u.is_active = 1 AND u.status = 1 AND f.user_id = ${userId}
    `).then((countedData) => {
      const tasks = [];

      providers[0].forEach((provider) => {
        tasks.push((cb) => {
          return ProviderPortfolioImages.findAll({
            attributes: [
              'link', 'tags',
              [
                sequelize.literal(
                  '(SELECT GROUP_CONCAT(sp.name) FROM ' + Specialties.getTableName() +
                  ' AS sp WHERE FIND_IN_SET(sp.id, `' +
                  ProviderPortfolioImages.getTableName() + '`.tags))'
                ),
                'tags_name'
              ],
              [
                sequelize.literal(
                  '(SELECT GROUP_CONCAT(sp.slug) FROM ' + Specialties.getTableName() +
                  ' AS sp WHERE FIND_IN_SET(sp.id, `' +
                  ProviderPortfolioImages.getTableName() + '`.tags))'
                ),
                'tags_slug'
              ],
            ],
            where: {
              user_id: provider.id,
            },
            limit: 5
          })
          .then((result) => {
            result = result.map(obj => {
              obj = obj.toJSON();
              if (obj.tags) {
                const slugs = obj.tags_slug.split(',');
                const ids = obj.tags.split(',');
                obj.tags = obj.tags_name.split(',').map((tagName, i) => {
                  return {
                    id: ids[i],
                    slug: slugs[i],
                    name: tagName
                  };
                });
              } else {
                obj.tags = [];
              }
              
              delete obj.tags_slug;
              delete obj.tags_name;
              return obj;
            });
            return cb(null, result);
          })
          .catch(cb);
        });
      });

      return promisify(async.parallel, tasks).then(result => {
        providers[0] = providers[0].map((provider, index) => {
          provider.images = result[index];
          return provider;
        });

        return h.response({
          data: providers[0],
          paging: {
            total: countedData[0][0].count
          }
        });
      })
      .catch((err) => {
        return Boom.internal(err);
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
