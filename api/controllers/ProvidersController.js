'use strict';
const Users = require('../models/Users');
const Providers = require('../models/Providers');
const Locations = require('../models/Locations');
const Specialties = require('../models/Specialties');
const Reviews = require('../models/Reviews');
const promisify = require('../services/Helpers').promisify;
const ProviderAddOns = require('../models/ProviderAddOns');
const UsersLocations = require('../models/UsersLocations');
const ProviderCancellationPolicies = require('../models/ProviderCancellationPolicies');
const ProviderPortfolioImages = require('../models/ProviderPortfolioImages');
const FavoriteImages = require('../models/FavoriteImages');
const async = require('async');
const to = require('await-to-js').to;
const tokenVerificationService = require('../services/VerifyJWTService');
const emailService = require('../services/EmailService');
const Boom = require('boom');
const sequelize = require('../../config/sequelize');
const {SITE_URL} = require('../../config');
const controller = {};

controller.getProviders = function (request, h) {
  let isFavorite = '';
  if (request.userId) {
    isFavorite = `, (SELECT COUNT(*) FROM ws_favorite_providers WHERE user_id = ${request.userId} AND favorited = u.id) AS is_favorite`
  }

  const sortOrder = request.query.sort_order;
  const sortBy = request.query.sort_by;
  const filterB2b = request.query.b2b;
  const minPrice = request.query.min_price;
  const maxPrice = request.query.max_price === 300 ? null : request.query.max_price; //if its 300+ then no need for max price, we need all of them
  const minRating = request.query.min_rating;
  const maxRating = request.query.max_rating;
  let searchText = request.query.search || '';
  const specialty = request.query.specialty.map((s, index) => `(specialty LIKE "%${s}%") ` + (request.query.specialty.length != (index+1) ? 'OR ' : '')).join('');
  const location = request.query.location.map((s, index) => `(city LIKE "%${s.toLowerCase().replace(/-/g, '')}%") ` + (request.query.location.length != (index+1) ? 'OR ' : '')).join('');
  let having = '';
  const page = request.query.page;
  const limit = request.query.limit;

  if (specialty || minPrice || maxPrice || minRating || maxRating || location ) {
    const queryObj = {
      price: {
        min: minPrice,
        max: maxPrice
      },
      rating :{
        min: minRating,
        max: maxRating
      },
      specialty: specialty || null,
      city: location || null
    };

    for (let key in queryObj) {
      if (typeof queryObj[key] == 'undefined' || queryObj[key] == null) {
        continue;
      }
      if (typeof queryObj[key] === 'object') {
        for (let nestKey in queryObj[key]) {
          if (typeof queryObj[key][nestKey] == 'undefined' || queryObj[key][nestKey] == null) {
            continue ;
          }

          if (having.length <= 0) { //NOTHING added yet, so don't start with AND
            having += `${key} ${nestKey === 'min' ? ' >= ' : ' <= '} ${queryObj[key][nestKey]}` + '';
          } else {
            having += ` AND ${key} ${nestKey === 'min' ? ' >= ' : ' <= '} ${queryObj[key][nestKey]}` + '';
          }
        }
      } else {
        if (having.length <= 0) { //NOTHING added yet, so don't start with AND
          having += `${queryObj[key]}` + '';
        } else {
          having += ` AND ${queryObj[key]}` + '';
        }
      }
    }
  }

  if (searchText) {
    searchText = searchText.split(' '); // break the search query with spaces
    searchText = searchText.map((s, index) => `(u.first_name LIKE "%${s}%" OR u.last_name LIKE "%${s}%") ` + (searchText.length != (index+1) ? 'AND ' : '')).join('');
  }

  return sequelize.query(`
    SELECT u.id, u.username,
      IFNULL(provider.visible_in_search, 0) as show_in_search,
      u.first_name, u.image as imageFile, u.cover, u.last_name, provider.title, provider.is_featured,
      provider.hourly_rate as price, GROUP_CONCAT(s.slug) as specialty_slug,
      (
        select group_concat(loc.key) from ws_users_locations as u_loc
        left join locations as loc
        on u_loc.location_id = loc.id
        where u_loc.user_id = u.id
        ) as city,
      GROUP_CONCAT(s.name) as specialty,
      IFNULL((SELECT ROUND(AVG(rt.rating),2) FROM ws_reviews as rt WHERE rt.review_for = u.id), 0) as rating
      ${isFavorite}
    FROM ws_users as u
    LEFT JOIN ws_providers as provider
      ON u.provider_id = provider.id
    LEFT JOIN specialty as s
      ON FIND_IN_SET(s.id, provider.specialty)
    WHERE (u.provider_id is not null) ${searchText ? (' AND ' + searchText) : ''}
    GROUP BY u.id
    ${having ? 'HAVING ' + having + ' AND (show_in_search=1)' : 'HAVING (show_in_search=1)'}
    ORDER BY case provider.is_featured when 1 then 1 else 2 end, ${sortBy} ${sortOrder.toUpperCase()}
    LIMIT ${limit} OFFSET ${page*limit}`
  ).then(providers => {
    return sequelize.query(`
      SELECT count(*) as count FROM (
        SELECT count(*) as count, IFNULL(provider.visible_in_search, 0) as show_in_search,
        u.first_name, u.image, u.cover, u.last_name, provider.title,
        provider.hourly_rate as price, GROUP_CONCAT(s.slug) as specialty_slug,
        (
          select group_concat(loc.key) from ws_users_locations as u_loc
          left join locations as loc
          on u_loc.location_id = loc.id
          where u_loc.user_id = u.id
          ) as city,
        GROUP_CONCAT(s.name) as specialty,
        IFNULL((SELECT ROUND(AVG(rt.rating),2) FROM ws_reviews as rt WHERE rt.review_for = u.id), 0) as rating
        FROM ws_users as u
        LEFT JOIN ws_providers as provider
          ON u.provider_id = provider.id
        LEFT JOIN specialty as s
          ON FIND_IN_SET(s.id, provider.specialty)
        WHERE (u.provider_id is not null) ${searchText ? (' AND ' + searchText) : ''}
        GROUP BY u.id
        ${having ? 'HAVING ' + having + ' AND (show_in_search=1)' : 'HAVING (show_in_search=1)'}
      ) as counted;
    `).then((countedData) => {
      return sequelize
        .query(`
          SELECT DISTINCT(loc.title), loc.key,
            (
              SELECT COUNT(DISTINCT(u_loc.user_id))
              FROM ws_users_locations as u_loc
              WHERE loc.id = u_loc.location_id
            ) as count
          FROM locations as loc
          HAVING count > 0
          ORDER BY RAND()
          LIMIT 18;
        `)
        .then((locations) => {
          return sequelize //${filterB2b ? 'WHERE b2b = true' : ''}
            .query(`SELECT name, slug FROM specialty;`)
            .then((specialty) => {

              const tasks = [];
              const ProviderPortfolioImagesAttr = [
                'link', 'tags', 'id',
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
                ]
              ];

              if (request.userId) {
                ProviderPortfolioImagesAttr.push(
                  [
                    sequelize.literal(
                      '(SELECT COUNT(*) FROM ' + FavoriteImages.getTableName() +
                      ' AS favImg WHERE favImg.image_id = `' + ProviderPortfolioImages.getTableName() + '`.id' +
                      ' AND favImg.user_id = ' + request.userId +' )'
                    ),
                    'is_favorite'
                  ]
                );
              }

              providers[0].forEach((provider) => {
                tasks.push((cb) => {
                  return ProviderPortfolioImages.findAll({
                    attributes: ProviderPortfolioImagesAttr,
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
                    return cb(null, result)
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
                  specialty: specialty[0],
                  related_results: locations[0],
                  data: providers[0],
                  paging: {
                    total: countedData[0][0].count
                  }
                });
              })
              .catch(err => {
                return Boom.internal(err);
              });
            })
            .catch((e) => {
              return Boom.internal(e);
            });
        })
        .catch((r) => {
          console.log(r);
          return Boom.internal(r);
        });
    })
    .catch((e) => {
      console.log(e);
      return Boom.internal(e);
    });
  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });
};

controller.getOneProvider = function (request, h) {
  const {include_addons, include_related_results, include_specialties} = request.query;
  const providerId = request.params.provider_id;

  const findObj = {
    provider_id: sequelize.literal('`ws_users`.`provider_id` IS NOT NULL'),
  };

  if (providerId === 'me') {
    findObj.id = request.userId;
  } else if (parseInt(providerId)) {
    findObj.id = providerId;
  } else {
    findObj.username = providerId;
  }

  const providerInclude = {
    model: Providers, as: 'provider',
    attributes: [
      'title', 'about', 'note', 'company_name', 'hourly_rate', 'per_day_rate',
      'edits_per_hour', 'min_hours_for_booking', 'max_group_size', 'delivery_time',
      'languages', 'website_link', 'social_media_links', 'extra_edit_cost', 'camera_type',
      'raw_photos_per_hour',
      [sequelize.literal('(SELECT ROUND(AVG(rt.rating), 2) FROM ws_reviews AS rt WHERE rt.review_for = `ws_users`.`id`)'), 'rating'],
    ],
    include: [
      {
        model: ProviderCancellationPolicies, as: 'cancellation_policy',
        attributes:{ exclude: ['updated_at', 'created_at']}
      }
    ]
  };

  if (providerId === 'me') {
    providerInclude.attributes.push('payout_data');
  }

  if (include_specialties) {
    providerInclude.attributes.push([sequelize.literal(`(SELECT GROUP_CONCAT(sp.name) FROM specialty AS sp WHERE FIND_IN_SET(sp.id, provider.specialty))`), 'specialties']);
    providerInclude.attributes.push([sequelize.literal(`(SELECT GROUP_CONCAT(sp.slug) FROM specialty AS sp WHERE FIND_IN_SET(sp.id, provider.specialty))`), 'specialties_slug'] );
  }

  if (include_addons) {
    providerInclude.include.push({
      model: ProviderAddOns, as: 'addons',
      attributes: ['id', 'title', 'description', 'addon_price']
    });
  }

  return Users.findOne({
    attributes: [
      'id', 'provider_id', 'username', 'first_name', 'last_name', 'cover', 'image','phone_verified', 'languages', 'created_at'
    ],
    include: [
      providerInclude,
      {
        model: UsersLocations, as: 'locations', attributes: ['id'],
        include: [{
          model: Locations, as: 'location',
          attributes: ['id', 'title', 'country', 'key']}
        ]
      }
    ],
    where: findObj,
  }).then((user) => {
    if (!user) {
      return Boom.notFound('Provider not found');
    }
    user = user.toObject();

    if (include_specialties) {
      const tmp = [];
      const tmpSlug = (user.provider.specialties_slug || '').split(',');
      (user.provider.specialties || '').split(',').forEach((name, index) => {
        tmp.push({
          name, slug: tmpSlug[index]
        });
      });
      user.provider.specialties = tmp;
      delete user.provider.specialties_slug;
    }

    if (include_related_results) {
      const locationsQuery = user.locations.map((loc) => (
        `(FIND_IN_SET("${loc.location.id}", location))`
      )).join(' OR ');

      return sequelize.query( // generate 18 records (9 above and 9 below) which lies in same city
        `(
            SELECT user.id, GROUP_CONCAT(user_loc.location_id) AS location
            FROM ws_users AS user
            LEFT JOIN ws_users_locations AS user_loc
            ON user.id = user_loc.user_id
            WHERE provider_id IS NOT NULL AND user.id < ${providerId}
            GROUP BY user.id
            ${locationsQuery.length ? 'HAVING ' + locationsQuery : ''}
            ORDER BY user.id DESC LIMIT 9
          )
          UNION ALL
          (
            SELECT user.id, GROUP_CONCAT(user_loc.location_id) AS location
            FROM ws_users AS user
            LEFT JOIN ws_users_locations AS user_loc
            ON user.id = user_loc.user_id
            WHERE provider_id IS NOT NULL AND user.id > ${providerId}
            GROUP BY user.id
            ${locationsQuery.length ? 'HAVING ' + locationsQuery : ''}
            ORDER BY user.id ASC LIMIT 9
          )`
      ).then((result) => {
        return h.response({data: user , related_results: result[0]});
      })
      .catch((err) => {
        console.log(err);
        return Boom.internal(err);
      });
    } else {
      return h.response({data: user});
    }

  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });

};

controller.getProviderPortfolio = function (request, h) {
  const {provider_id} = request.params;

  const findObj = {
    [parseInt(provider_id) ? 'id' : 'username']: provider_id
  };

  return Users.findOne({
    attributes: ['id'],
    where: findObj
  })
  .then((user) => {
    const ProviderPortfolioImagesAttr = [
      'id', 'width', 'height', 'resized_value', 'link', 'camera_type', 'tags',
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
      ]
    ];

    if (request.userId && request.isCustomer) {
      ProviderPortfolioImagesAttr.push(
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM ' + FavoriteImages.getTableName() +
            ' AS favImg WHERE favImg.image_id = `' + ProviderPortfolioImages.getTableName() + '`.id' +
            ' AND favImg.user_id = ' + request.userId +' )'
          ),
          'is_favorite'
        ]
      );
    }
    return ProviderPortfolioImages.findAll({
      attributes: ProviderPortfolioImagesAttr,
      where: {
        user_id: user.id,
      }
    })
    .then((portfolio) => {
      portfolio = portfolio.map(obj => {
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
      return h.response(portfolio);
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });

};

controller.updateProviderInfo = async function (request, h) {
  if (!request.isProvider) return Boom.unauthorized();

  const userId = request.userId;
  const username = request.payload.username;
  const providerId = request.providerId;
  const providerInfo = request.payload.provider || {};
  const providerAddons = providerInfo.addons || [];
  const userInfo = request.payload;
  let locations = request.payload.locations || [];
  delete userInfo.provider;
  delete providerInfo.addons;
  delete userInfo.locations;

  if(providerInfo.specialty){
    providerInfo.specialty = providerInfo.specialty.join(',');
  }

  if(providerInfo.camera_type){
    providerInfo.camera_type = providerInfo.camera_type.join(',');
  }

  if(providerInfo.languages){
    providerInfo.languages = providerInfo.languages.join(',');
  }

  if(providerInfo.social_media_links){
    providerInfo.social_media_links = JSON.stringify(providerInfo.social_media_links);
  }

  if (username) {
    const [err, existingUser] = await to(Users.findOne({where: {username}}));
    if (existingUser || err) {
      return Boom.conflict('A user with this Username already exist!');
    }
  }

  return Users.findOne({
    where: {id: userId},
    attributes: ['id'],
    include: [
      {model: UsersLocations, as: 'locations', attributes: ['id']},
      {
        model: Providers, as: 'provider',
        include: [{model: ProviderAddOns, as: 'addons', attributes: ['id']}]
      }
    ]
  })
  .then((User) => {
    if (!User) {
      return Boom.notFound('User not found');
    }

    const updatedUserInfo = (cb) => {
      return Users.update(userInfo, {where: {id: userId}}).then(() => {
        return cb(null, {});
      })
      .catch((err) => {
        cb(err);
      });
    };

    const updatedProviderInfo = (cb) => {
      providerInfo.visible_in_search = User.provider.profile_completed || providerInfo.profile_completed;
      Providers.update(providerInfo, {where: {id: providerId}}).then(() => {
        return cb(null, {});
      })
      .catch((err) => {
        return cb(err);
      });
    };

    const addUpdateProviderLocations = (cb) => {
      if (!locations.length) {
        // No need to do anything
        return cb(null, {});
      }
      // get which are deleted
      const deletedIds = (User.locations || []).filter((parentObj) => (
        !locations.filter((childObj) => childObj.id && (childObj.id == parentObj.id)).length
      )).map(obj => obj.id);
      const tasks = [];
      // First delete those locations which user has removed form their profile
      tasks.push((cb) => {
        if (!deletedIds.length) {
          return cb(null, {});
        }
        return UsersLocations.destroy({
          where: {
            id: {
              $or: deletedIds
            }
          }
        })
        .then(() => cb(null, {}))
        .catch(cb);
      });
      // Check for new locations, if any, check locations table if they exist otherwise
      // create and save the id
      const newLocations = locations.filter(obj => !obj.id);
      newLocations.forEach((loc) => {
        tasks.push((cb) => {
          return Locations.findOrCreate({
            where: sequelize.where(sequelize.fn('lower', sequelize.col('title')), loc.location.toLowerCase()),
            defaults: {
              title: loc.location, country: loc.country,
              key: loc.location.replace(/ /g, '').toLowerCase(),
              lat: loc.lat, lon: loc.long
            }
          })
          .spread((location) => {
            return UsersLocations
              .create({user_id: userId, location_id: location.id}, {})
              .then(() => cb(null, {}))
              .catch(cb);
          })
          .catch(cb);
        });
      });

      return async.parallel(tasks, cb);
    };

    const addUpdateProviderAddons = (cb) => {
      if (!providerAddons.length) {
        // No need to do anything
        return cb(null, {});
      }
      const tasks = [];
      // get which are deleted

      tasks.push((cb) => {
        const deletedIds =
          ((User.provider && User.provider.addons) || [])
          .filter((parentObj) => (
            !providerAddons
              .filter((childObj) => childObj.id && (childObj.id == parentObj.id))
              .length
          )).map((obj) => obj.id);
        if (!deletedIds.length) {
          return cb(null, {});
        }
        return ProviderAddOns.destroy({
          where: {
            id: {
              $or: deletedIds
            }
          }
        })
        .then(() => cb(null, {}))
        .catch(cb);
      });

      tasks.push((cb) => {
        const toUpdate = providerAddons.filter(obj => !!obj.id).map((obj) => {
          obj.provider_id = providerId;
          return obj;
        });
        if (!toUpdate.length) return cb(null, {});
        return ProviderAddOns
          .bulkCreate(toUpdate, {
            updateOnDuplicate: ['title', 'addon_price', 'description']
          })
          .then(() => cb(null, {}))
          .catch(cb);
      });


      tasks.push((cb) => {
        // Check for new addons, if any, create them
        const newAddons = providerAddons.filter(obj => !obj.id).map(obj => {
          obj.provider_id = providerId;
          return obj;
        });
        if (!newAddons.length) return cb(null, {});

        return ProviderAddOns
          .bulkCreate(newAddons)
          .then(() => cb(null, {}))
          .catch(cb);
      });
      return async.parallel(tasks, cb);
    };

    const executeTasks = () => {
      const tasks = [
        updatedUserInfo, updatedProviderInfo,
        addUpdateProviderLocations, addUpdateProviderAddons
      ];

      return  promisify(async.parallel, tasks).then((err) => {
        if (providerInfo.profile_completed && !User.provider.profile_completed) {
          emailService
            .sendEmail(request.email, request.name, emailService.PROFILE_COMPLETION_PROVIDER, {provider_name: request.name})
            .catch(() => console.log('error sending email for profile completion'));
        }
        return h.response({success: true});
      })
      .catch(err => {
        console.log(err);
        return Boom.internal(err);
      });
    };


    if (userInfo.username) {
      // check if its a valid username and isn't taken
      return Users
        .findOne({where: {username: userInfo.username}})
        .then((usernameFound) => {
          if (usernameFound) {
            return h.response({error: true, message: 'A user with this username already exist'});
          } else {
            return executeTasks();
          }
        })
        .catch((e) => {
          return Boom.internal(e);
        });
    } else {
      return executeTasks();
    }
  })
  .catch((er) => {
    console.log(er, 'top most');
    return Boom.internal(er);
  });
};

controller.connectSocialMedia = function (request, h) {
  console.log(request.auth.credentials);
  const redirectUser = (error, success) => {
    if (error) {
      return h.redirect(`${SITE_URL}/connect-redirect?error=${error}`);
    }
    return h.redirect(`${SITE_URL}/connect-redirect?success=${success}`);
  };

  if (request.auth.isAuthenticated) {
    const provider = request.auth.credentials.provider;
    const username = request.auth.credentials.profile.username || request.auth.credentials.profile.id;
    const link = `https://${provider}.com/${username}`;
    // Check if the User is authenticated or not
    if (!request.auth.credentials.query || !request.auth.credentials.query.jwt) {
      return redirectUser('You are not authorised to request the resource');
    } else {
      return tokenVerificationService.verify(request.auth.credentials.query.jwt).then((user) => {
        if (!user.isProvider) {
          // Customers don't have access to the endpoint
          return redirectUser('You dont have access to requested resource');
        } else {
          // Good to go, save it
          return Providers.findOne({where: {id: user.providerId}}).then((Provider) => {
            if (!Provider) {
              return redirectUser('Provider not found');
            }
            const socialMediaLinks = JSON.parse(Provider.social_media_links || '{}');
            socialMediaLinks[provider] = link;
            return Providers
              .update(
                {social_media_links: JSON.stringify(socialMediaLinks)},
                {where: {id: user.providerId}}
              )
              .then(() => {
                return redirectUser(null, `Your ${provider} account was linked successfully!`);
              })
              .catch(() => {
                return redirectUser('Error occurred while writing to DB');
              });
          })
          .catch(() => {
            return redirectUser('Error occurred while reading DB');
          });
        }
      })
      .catch(() => {
        // Token not valid; unauthorised
        return redirectUser('You are not authorised to request the resource');
      });
    }
  } else {
    return redirectUser('Error occurred while connecting account');
  }
};

module.exports = controller;
