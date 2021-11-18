'use strict';
const Users = require('../models/Users');
const Providers = require('../models/Providers');
const UsersLocations = require('../models/UsersLocations');
const Customers = require('../models/Customers');
const Locations = require('../models/Locations');
const ProviderCancellationPolicies = require('../models/ProviderCancellationPolicies');
const sequelize = require('../../config/sequelize');
const promisify = require('../services/Helpers').promisify;
const JWT = require('jsonwebtoken');
const emailService = require('../services/EmailService');
const TransactionService = require('../services/TransactionService');
const config = require('../../config/index');
const uuid = require('node-uuid');
const jwtConfig = require('../../config/jwt.json');
const {SITE_URL, FORGOT_PASSWORD_TOKEN_EXPIRE_LIMIT} = require('../../config');
const Boom = require('boom');
const bcrypt = require('bcrypt');
const async = require('async');
const LedgerService = require('../services/LedgerService');
const controller = {};

controller.preSignup = function (request, h) {
  const first_name = request.payload.first_name;
  const last_name = request.payload.last_name;
  const email = request.payload.email;
  const findObj = {
    where: {
      email
    }
  };

  return Users
    .findOne(findObj)
    .then((User) => {
      if (User) {
        return h.response({
          error: true,
          message: "A User with this email already exist, Please Login instead."
        });
      }
      const passResetToken = uuid.v1();
      return createPreSignupUser(passResetToken, {
        username: 'u' + Date.now(), first_name,
        last_name, email, password_reset_token: passResetToken, status: 2 //pre signup
      }, h);
    })
    .catch((err) => {
      return Boom.internal(err);
    });
};

controller.completePreSignup = function (request, h) {
  const token = request.params.token;
  const {password, username} = request.payload;

  return Users.findOne({
    attributes: ['id'],
    where: {
      username: request.payload.username
    }
  })
  .then((user) => {
    if (user) {
      return h.response({
        error: true,
        message: 'A User with this username already exist, Try with new one.'
      });
    }
    return hashPassword(password).then(pass => {
      return Users.update({password_hash: pass, username, status: 1}, {
        where: {
          password_reset_token: token,
          status: 2
        }
      })
      .then(() => {
        return h.response({success: true});
      })
      .catch((err) => {
        return Boom.internal(err);
      });
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.getPreSignupDetails = function (request, h) {
  const token = request.params.token;
  return Users.findOne({
    attributes: ['first_name', 'last_name', 'email'],
    where: {
      password_reset_token: token,
      status: 2
    }
  })
  .then((user) => {
    if (!user) {
      return Boom.notFound('Pre signup user not found');
    }
    
    return h.response(user);
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.login = function (request, h) {
  const username = request.payload.username;
  const password = request.payload.password;
  const findObj = {
    where: {},
    include: [{model: Providers, as: 'provider', attributes: ['profile_completed']}]
  };

  // if its email then find by email otherwise defaults to username
  if (username.indexOf('@') >= 0) {
    findObj.where.email = username;
  } else {
    findObj.where.username = username;
  }

  return Users.findOne(findObj)
  .then((User) => {
    if (!User) {
      return h.response({ error: true, message: "E-mail/Username or Password are incorrect." });
    }
    return User.comparePassword(password).then((match) => {
      if (!match) {
        return h.response({ error: true, message: "E-mail/Username or Password are incorrect." });
      }
      let token = JWT.sign({
        userId: User.id,
        username: User.username,
        role: User.role
      }, jwtConfig.secret, {
        expiresIn: jwtConfig.duration
      });
      let user = User.toObject();

      return h.response({jwt: token, data: user});
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.signupCustomer = function (request, h) {
  const {referral_code, username, email} = request.payload;
  delete request.payload.referral_code;
  const user = request.payload;
  //first test username existing
  return Users.findOne({
    where: {
      $or: [ // if email or username is found
        {
          username: 
          {
            $eq: username
          }
        }, 
        {
          email: 
          {
            $eq: email
          }
        }, 
      ]
    }
  })
  .then((User) => {

    if (User) {
      const obj = User.toObject();
      if (obj.email == request.payload.email) {
        return h.response({ error: true, message: "Oopps. This email is already registered. Try reseting password if you forgot." });
      } else {
        return h.response({ error: true, message: "Oopps. This username is already taken. Try another one." });
      }
    }

    return hashPassword(request.payload.password).then(function (hashedPassword) {

      user.password_hash = hashedPassword;
      user.role = 0;

      if (referral_code) {
        //find user who is referred user by referral code as username
        return Users.findOne({
          attributes: ['id', 'credit'],
          where: {
            username: referral_code
          }
        })
        .then((referredUser) => {
          //found referred user
          if(referredUser){
            //save referred user id as new user's referral code id
            user.referral_codes_id = referredUser.id;
            user.credit = config.REFERRAL_SIGNUP_BONUS;
            user.referredUser = referredUser;
          }
          //continue signup with referral code
          return createUser(user, h);
        })
        .catch((err) => {
          return Boom.internal(err);
        });
      } else {
        //continue signup
        return createUser(user, h);
      }
      
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  });
};

controller.signupProvider = function (request, h) {
  const {
    hourly_rate, min_hours_booking, photography_style,
    username, email, city, lat, long, country
  } = request.payload;
  delete request.payload.hourly_rate;
  delete request.payload.min_hours_booking;
  delete request.payload.photography_style;
  delete request.payload.lat;
  delete request.payload.long;
  const user = request.payload;

  return Locations.findOrCreate({
    where: sequelize.where(sequelize.fn('lower', sequelize.col('title')), city.toLowerCase()),
    defaults: {
      title: city, country, key: city.replace(/ /g, '').toLowerCase(),
      lat, lon: long
    }
  })
  .spread((location) => {
    // check if specialty ids are correct
    return sequelize.query(`SELECT FIND_IN_SET(id, '${photography_style}') as found FROM specialty HAVING found > 0;`)
    .then((specialty) => {
      if (specialty[0].length === photography_style.split(',').length) {
        //first test username existing
        return Users.findOne({
          where: {
            $or: [ // if email or username is found
              {
                username: 
                {
                  $eq: username
                }
              }, 
              {
                email: 
                {
                  $eq: email
                }
              }, 
            ]
          }
        })
        .then((User) => {

          if (User) {
            const obj = User.toObject();
            if (obj.email == request.payload.email) {
              return h.response({ error: true, message: "Oopps. This email is already registered. Try reseting password if you forgot." });
            } else {
              return h.response({ error: true, message: "Oopps. This username is already taken. Try another one." });
            }
          }

          return hashPassword(request.payload.password).then(function (hashedPassword) {

            user.password_hash = hashedPassword;
            user.role = 10;
            // create snapper_additionals row and save id here in user
            return Users.create(user).then((User) => {
              let userObj = User.toObject();
              
              return promisify(async.parallel, [
                // Create locations
                (cb) => {
                  UsersLocations.create({
                    user_id: User.id,
                    location_id: location.id
                  })
                  .then(() => cb(null, {}))
                  .catch(cb);
                },
                //create ledger account for provider
                (cb) => {
                  LedgerService.createProviderAccount(User.id)
                    .then(() => cb(null, {}))
                    .catch(cb);
                },
                // Create provider and associate with user
                (cb) => {
                  ProviderCancellationPolicies.findOne({
                    where: {
                      slug: 'flexible'
                    }
                  })
                  .then((policy) => {
                    Providers.create({
                      specialty: photography_style,
                      min_hours_for_booking: min_hours_booking,
                      hourly_rate, cancellation_policy_id: policy.id
                    })
                    .then((provider) => {
                      Users
                        .update({provider_id: provider.id}, {where: {id: User.id}})
                        .then(() => cb(null, {}))
                        .catch((err) => {
                          provider.destroy();
                          User.destroy();
                          return cb(err);
                        });
                    })
                    .catch((err) => {
                      User.destroy();
                      return cb(err);
                    });
                  })
                  .catch((err) => {
                    User.destroy();
                    return cb(err);
                  });
                }
              ]).then(res => {
                //return JWT
                let token = JWT.sign({
                  userId: userObj.id,
                  username: userObj.username,
                  role: userObj.role
                }, jwtConfig.secret, {
                  expiresIn: jwtConfig.duration
                });
                // Send email
                emailService
                  .sendEmail(userObj, userObj.first_name + ' ' + userObj.last_name, emailService.SIGN_UP_PROVIDER)
                  .catch((e) => {
                    console.log('Error sending email', e);
                  });
                return h.response({jwt: token, data: userObj});
              })
              .catch(err => {
                return Boom.internal(err);
              });
            })
            .catch((err) => {
              return Boom.internal(err);
            });
          })
          .catch((err) => {
            return Boom.internal(err);
          });
        })
        .catch((err) => {
          return Boom.internal(err);
        });
      } else {
        return Boom.notFound('Given photography styles not found');
      }
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.changePassword = function (request, h) {
  const userId = request.userId;
  const password = request.payload.password;
  const newPassword = request.payload.new_password;
  
  return Users.findOne({
    where: { id: userId }
  })
  .then((User) => {
    if (!User) {
      return h.response({ error: true, message: "Mismatch user ID" });
    }
  
    return User.comparePassword(password).then((match) => {
      if (!match) {
        return h.response({ error: true, message: "Wrong password supplied" });
      }

      return hashPassword(newPassword).then((hashedPassword) => {
        User.update({ password_hash: hashedPassword })
        .then(() => {
          return h.response({ success: true, message: "Password was changed" });
        })
        .catch((err) => {
          return Boom.internal(err);
        });
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.sendResetPasswordEmail = function (request, h) {
  const email = request.payload.email;
  return Users.findOne({
    attributes: ['id', 'first_name', 'last_name'],
    where: {email}
  })
  .then((User) => {
    if (!User) {
      return Boom.notFound('We couldn\'t find a user with this email.');
    }
    //Generate token, send email and set date sent as now and save in db
    const token = uuid.v1();
    const url = `${SITE_URL}/auth/reset-password?token=${token}&email=${email}`;
    const name = User.first_name + ' ' + User.last_name;
    // send email
    return emailService
      .sendEmail(email, name, emailService.FORGOT_PASSWORD, {url})
      .then(() => {
        // save in the db
        return Users.update({
          password_reset_token: token,
          reset_password_token_date: new Date()
        }, {where: {id: User.id}})
        .then(() => {
          return h.response({success: true});
        })
        .catch((e) => {
          return Boom.internal(e);
        });
      })
      .catch((e) => {
        return Boom.internal(e);
      });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.resetUserPassword = function (request, h) {
  const {token, new_password, email} = request.payload;

  return Users.findOne({
    attributes: ['id', 'reset_password_token_date', 'password_reset_token'],
    where: {
      email, password_reset_token: token
    }
  })
  .then((User) => {
    if (!User) {
      return h.response({error: true, message: 'Email or token is incorrect'});
    }
    const tokenCreationDate = new Date(User.reset_password_token_date).valueOf();
    const tokenExpirationTime = 1000 * 60 * 60 * FORGOT_PASSWORD_TOKEN_EXPIRE_LIMIT;
    if ((Date.now() - tokenCreationDate) > tokenExpirationTime) {
      return h.response({error: true, message: 'Token has been expired.'});
    }
    // Good to go
    return hashPassword(new_password).then((hashedPassword) => {
      return User.update({
        password_hash: hashedPassword,
        reset_password_token_date: null, 
        password_reset_token: null
      })
      .then(() => {
        return h.response({ success: true, message: 'Password was changed' });
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

function createPreSignupUser(token, user, h) {
  return Users.create(user).then((User) => {
    return Customers.create({}).then((customer) => {
      return Users.update({customer_id: customer.id}, {where: {id: User.id}}).then(() => {

        let userObj = User.toObject();

        //send pre signup email
        emailService.sendEmail(userObj.email, userObj.first_name + ' ' + (userObj.last_name || ''), emailService.PRE_SIGN_UP_CUSTOMER, {token})
          .catch((er) => {
            console.log('error sending presignup email ',token, er);
          });

        //create ledger account for customer
        LedgerService.createCustomerAccount(User.id)
          .catch((er)=>{
            console.log('error creating ledger account', er);
          });

        //return JWT
        let jwt = JWT.sign({
          userId: userObj.id,
          username: userObj.username,
          role: 0
        }, jwtConfig.secret, {
          expiresIn: jwtConfig.duration
        });
        return h.response({jwt, data: userObj});
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
}

function createUser(user, h) {

  let referredUser;

  if(user.referredUser){
    referredUser = user.referredUser;
    delete user.referredUser;
  } 

  return Users.create(user).then((User) => {
    return Customers.create({}).then((customer) => {
      return Users.update({customer_id: customer.id}, {where: {id: User.id}}).then(() => {

        let userObj = User.toObject();

        //email signup
        emailService.sendEmail(userObj.email, userObj.first_name + ' ' + (userObj.last_name || ''), emailService.SIGN_UP_CUSTOMER)
          .catch((er) => {
            console.log('error sending email', er);
          });

        //create ledger account for customer
        LedgerService.createCustomerAccount(User.id)
          .catch((er)=>{
            console.log('error creating ledger account', er);
          });

        //signup with referral code
        if(referredUser){

          //retrive credit from user
          let credit = referredUser.credit >= 0 ? referredUser.credit : 0; 

          //give credit to referred user
          credit += config.REFERRAL_SIGNUP_BONUS;
          
          //save updated credit to DB
          return Users
            .update({credit: credit}, {where : {id : referredUser.id}}                )
            .then(() => {

              //save transaction
              const transactionData = {
                amount: config.REFERRAL_SIGNUP_BONUS,
                referred_user_id: referredUser.id,
                user_id: userObj.id
              };

              //pass to service
              return TransactionService
                .userSignupWithReferralCode(transactionData)
                .then(() => {

                  //return JWT
                  let token = JWT.sign({
                    userId: userObj.id,
                    username: userObj.username,
                    role: userObj.role
                  }, jwtConfig.secret, {
                    expiresIn: jwtConfig.duration
                  });

                  return h.response({jwt: token, data: userObj});
                })
                .catch((err) => {
                  return Boom.internal(err);
                });
            })
            .catch((err)=>{
              return Boom.internal(err);
            });
        } 
        
        //normal signup 
        else { 

          //return JWT
          let token = JWT.sign({
            userId: userObj.id,
            username: userObj.username,
            role: userObj.role
          }, jwtConfig.secret, {
            expiresIn: jwtConfig.duration
          });

          return h.response({jwt: token, data: userObj});

        }
        
      })
      .catch((err) => {
        return Boom.internal(err);
      });
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
}

function hashPassword(password) {
  const promise = new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return reject(err);

      // hash the password along with our new salt
      bcrypt.hash(password, salt, function (err, hash) {
        if (err) return reject(err);
        // if all is ok then return hash password
        resolve(hash);
      });
    });
  });
  return promise;
}

module.exports = controller;
