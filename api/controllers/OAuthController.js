const Users = require('../models/Users');
const Providers = require('../models/Providers');
const Customers = require('../models/Customers');
const JWT = require('jsonwebtoken');
const emailService = require('../services/EmailService');
const ShortUid = require('shortid');
const jwtConfig = require('../../config/jwt.json');
const config = require('../../config');

const controller = {};

controller.authWithFacebook = function (request, h) {
  if (!request.auth.isAuthenticated) {
    return h.response({error: true, message: request.auth.error && request.auth.error.message});
  }
  const isProvider = request.auth.credentials.query.is_provider == 'true';
  const credentials = request.auth.credentials;
  if (credentials && credentials.profile) {
    const profile = credentials.profile;
    const user = {
      auth_provider_id: profile.id,
      auth_provider: 'FACEBOOK',
      first_name: ( profile.name && profile.name.first ) || profile.displayName,
      last_name: profile.name && profile.name.last,
      image: `https://graph.facebook.com/${profile.id}/picture?type=large`,
      username: ShortUid.generate(),
      email: profile.email
    };

    if (!profile.email) {
      return redirectUser(h, 'No email is associated with your facebook account.');
    }

    return Users.findOne({
      where: {
        $or: [
          {
            email: user.email
          },
        ]
      }
    })
    .then((User) => {

      if (User) {
        if (isProvider && !User.provider_id) {
          return redirectUser(h, 'You have already signed up as Customer with this Email');
        }

        if (User.auth_provider_id != profile.id) {
          return Users.update({
            auth_provider_id: profile.id
          }, { where: {id: User.id}}).then(() => {
            return loginUserWithSocial(request, h, User);
          })
          .catch((er) => {
            return redirectUser(h, er.message);
          });
        } else {
          return loginUserWithSocial(request, h, User);
        }
      } else {

        user.role = isProvider ? 10 : 0;

        return Users.create(user)
        .then((User) => {
          const model = isProvider ? Providers : Customers;
          return model.create({}).then((infoObj) => {
            return Users
              .update(
                {[isProvider ? 'provider_id' : 'customer_id']: infoObj.id},
                {where: {id: User.id}}
              )
              .then(() => {
                emailService
                  .sendEmail(user.email, user.first_name + ' ' + user.last_name, emailService[isProvider ? 'SIGN_UP_PROVIDER' : 'SIGN_UP_CUSTOMER'])
                  .catch((e) => {
                    console.log(e, 'Error sending email');
                  });
                return loginUserWithSocial(request, h, User);
              })
              .catch((err) => {
                return redirectUser(h, err.message);
              });
          })
          .catch((err) => {
            return redirectUser(h, err.message);
          });
        })
        .catch((err) => {
          return redirectUser(h, err.message);
        });
      }
    });
  } else {
    return redirectUser(h, 'Something went wrong while connecting your account');
  }
};

function loginUserWithSocial(request, h, User) {
  let user = User.toObject();

  let token = JWT.sign({
    userId: user.id,
    username: user.username,
    role: user.role
  }, jwtConfig.secret, {
    expiresIn: jwtConfig.duration
  });

  return h.redirect(`${config.SITE_URL}/auth/oauth-redirect?user=${
    JSON.stringify({
      jwt: token,
      data: user
    })
  }`);
}

function redirectUser(h, error) {
  return h.redirect(`${config.SITE_URL}/auth/oauth-redirect?error=${
    JSON.stringify({
      message: error
    })
  }`);
}


module.exports = controller;
