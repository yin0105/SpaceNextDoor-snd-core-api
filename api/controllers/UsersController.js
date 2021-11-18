'use strict';
const Users = require('../models/Users');
const OTPService = require('../services/OTPService');
const Boom = require('boom');
const controller = {};

controller.disableUserAccount = function (request, h) {

  const userId = request.userId;
  const disabledStatus = 2;     

  return Users.findOne({ 
    where: {id: userId}
  })
  .then((User) => {
    if (!User) {
      return Boom.notFound('User not found');
    }

    return Users
      .update(
        { status: disabledStatus },
        { where: { id: userId } }
      )
      .then(() => {
        return h.response({success: true});
      })
      .catch((e) => {
        return Boom.internal(e);
      });

  })
  .catch((er) => {
    console.log(er);
    return Boom.internal(er);
  });

};

controller.updateUserStatus = function (request, h) {

  if (!request.isAdmin) return Boom.unauthorized();

  const userId = request.params.id;
  const userStatus = request.payload.status;

  return Users.findOne({ 
    where: { id: userId }
  })
  .then((User) => {
    if (!User) {
      return Boom.notFound('User not found');
    }

    return Users
      .update(
        { status: userStatus },
        { where: { id: userId } }
      )
      .then(() => {
        return h.response({success: true});
      })
      .catch((er) => {
        return Boom.internal(er);
      });

  })
  .catch((er) => {
    console.log(er);
    return Boom.internal(er);
  });

};


controller.sendVerificationCode = function (request, h) {
  const {phone_number, country_code} = request.payload;
  return Users.findOne({
    where: {
      phone: phone_number,
      phone_country_code: country_code
    }
  })
  .then((User) => {
    if (User) {
      return h.response({error: true, message: 'A User with this phone number already exist'});
    }
    return OTPService
      .createPhoneCode(phone_number, country_code, request.userId)
      .then((response) => {
        return h.response(response);
      })
      .catch((err) => {
        return Boom.internal(err);
      });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.verifyPhoneCode = function (request, h) {
  const {userId, payload: {code}} = request;
  return OTPService.verifyCode(userId, code).then((obj) => {
    return Users
      .update(
        {phone_country_code: obj.country_code, phone: obj.phone_number, phone_verified: true},
        {where: {id: request.userId}}
      )
      .then(() => {
        return h.response({success: true});
      })
      .catch((e) => {
        return Boom.internal(e);
      });
  })
  .catch((message) => {
    return h.response({error: true, message});
  });
};

module.exports = controller;
