'use strict';
const Users = require('../models/Users');
const Customers = require('../models/Customers');
const Locations = require('../models/Locations');
const promisify = require('../services/Helpers').promisify;
const UsersLocations = require('../models/UsersLocations');
const async = require('async');
const to = require('await-to-js').to;
const Boom = require('boom');
const sequelize = require('../../config/sequelize');
const controller = {};

controller.updateCustomers = async function (request, h) {

  if (!request.isCustomer) return Boom.unauthorized();

  const userId = request.userId;
  const userInfo = request.payload;
  const username = request.payload.username;
  const customerId = request.customerId;
  const customerInfo = request.payload.customer || {};
  let locations = request.payload.locations || [];

  delete userInfo.customer;
  delete userInfo.locations;

  if(userInfo.languages){
    userInfo.languages = userInfo.languages.join(',');
  }

  const [err, existingUser] = await to(Users.findOne({where: {username}}));
  if (existingUser) {
    return Boom.conflict('A user with this Username already exist!');
  }

  return Users.findOne({
    where: {id: userId},
    attributes: ['id'],
    include: [
      {model: Customers, as: 'customer', attributes: ['id']},
      {model: UsersLocations, as: 'locations', attributes: ['id']}
    ]
  })
  .then((User) => {
    if (!User) {
      return Boom.notFound('User not found');
    }

    const updatedUserInfo = (cb) => {
      return Users.update(userInfo, { where: { id: userId } }).then(() => {
        cb(null, {});
      })
      .catch((err) => {
        cb(err);
      });
    };

    const updateCustomerInfo = (cb) => {
      return Customers.update(customerInfo, {where: {id: customerId}}).then(() => {
        return cb(null, {});
      })
      .catch((err) => {
        return cb(err);
      });
    };

    const addUpdateUserLocations = (cb) => {
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
        UsersLocations.destroy({
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
          Locations.findOrCreate({
            where: sequelize.where(sequelize.fn('lower', sequelize.col('title')), loc.location.toLowerCase()),
            defaults: {
              title: loc.location, country: loc.country,
              key: loc.location.replace(/ /g, '').toLowerCase(),
              lat: loc.lat, lon: loc.long
            }
          })
          .spread((location) => {
            UsersLocations
              .create({user_id: userId, location_id: location.id}, {})
              .then(() => cb(null, {}))
              .catch(cb);
          })
          .catch(cb);
        });
      });

      return async.parallel(tasks, cb);
    };

    const executeTasks = () => {
      const tasks = [
        updatedUserInfo,
        updateCustomerInfo,
        addUpdateUserLocations
      ];

      return promisify(async.parallel, tasks).then(res => {
        return h.response({success: true});
      })
      .catch((err) => {
        return Boom.internal(err);
      });
    };

    if (userInfo.username) {
      // check username isn't taken
      return Users.findOne({
        where: {
          username: userInfo.username
        }
      })
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
    console.log(er);
    return Boom.internal(er);
  });
};

module.exports = controller;
