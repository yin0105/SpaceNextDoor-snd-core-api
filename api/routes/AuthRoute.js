const Joi = require('joi');
const AuthController = require('../controllers/AuthController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/auth/login',
      options: {
        auth: false,
        handler: AuthController.login,
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs in customers and providers using phone',
        notes: 'Signs in customers and providers usign phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/signup/pre/{type}',
      options: {
        auth: false,
        handler: AuthController.preSignup,
        validate: {
          params: {
            type: Joi.string().valid(['CUSTOMER']).required()
          },
          payload: {
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Pre Signs up users with just email and name',
        notes: 'Pre Signs up users with just email and name'
      }
    },
    {
      method: 'PUT',
      path: '/auth/signup/pre/{token}',
      options: {
        auth: false,
        handler: AuthController.completePreSignup,
        validate: {
          params: {
            token: Joi.string().required()
          },
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Completes the Pre Sign up',
        notes: 'Completes the Pre Sign up'
      }
    },
    {
      method: 'GET',
      path: '/auth/signup/pre/{token}',
      options: {
        auth: false,
        handler: AuthController.getPreSignupDetails,
        validate: {
          params: {
            token: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Gets the Pre Signs up user info',
        notes: 'Gets the Pre Signs up user info'
      }
    },
    {
      method: 'POST',
      path: '/auth/signup/customer',
      options: {
        auth: false,
        handler: AuthController.signupCustomer,
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required(),
            first_name: Joi.string().required(),
            last_name: Joi.string(),
            email: Joi.string().email().required(),
            city: Joi.string(),
            languages: Joi.string(),
            other_language: Joi.string(),
            imageFile: Joi.string(),
            fb_id: Joi.string(),
            referral_code: Joi.string().allow('')
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up customers',
        notes: 'Signs up customers '
      }
    },
    {
      method: 'POST',
      path: '/auth/signup/provider',
      options: {
        auth: false,
        handler: AuthController.signupProvider,
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required(),
            first_name: Joi.string().required(),
            last_name: Joi.string(),
            email: Joi.string().email().required(),
            hourly_rate: Joi.number().required(),
            min_hours_booking: Joi.number().required(),
            photography_style: Joi.string().required(),
            city: Joi.string().required(),
            country: Joi.string().required(),
            lat: Joi.number().required(),
            long: Joi.number().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up providers or photographers',
        notes: 'Signs up providers '
      }
    },
    {
      method: 'PUT',
      path: '/auth/password/change',
      options: {
        auth: 'jwt',
        handler: AuthController.changePassword,
        validate: {
          payload: {
            password: Joi.string().required(),
            new_password: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'User change their password by sending "new_password", which be confirmed with existing "password".',
        notes: 'Change user password '
      }
    },
    {
      method: 'POST',
      path: '/auth/password/send_reset_email',
      options: {
        auth: false,
        handler: AuthController.sendResetPasswordEmail,
        validate: {
          payload: {
            email: Joi.string().email().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Send reset password email to the users email and save the token in the db' + 
        ' The email will have a reset password button which will have token and email as query param' +
        ' the link to the frontend will be /s/auth/reset-password',
        notes: 'Send forgot password email'
      }
    },
    {
      method: 'PUT',
      path: '/auth/password/reset',
      options: {
        auth: false,
        handler: AuthController.resetUserPassword,
        validate: {
          payload: {
            token: Joi.string().required(),
            email: Joi.string().email().required(),
            new_password: Joi.string().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Resets the users password',
        notes: 'Resets the password of the user by comparing the token with the one saved in db'
      }
    }
  ]);
};
