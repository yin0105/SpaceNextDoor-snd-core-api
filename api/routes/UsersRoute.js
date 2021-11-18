const Joi = require('joi');
const Controller = require('../controllers/UsersController');

module.exports = function (server, options, next) {

  server.route([
    
    {
      method: 'PUT',
      path: '/users/status',
      options: {
        auth: 'jwt',
        handler: Controller.disableUserAccount,
        tags: ['api', 'users'],
        description: 'Disable currently logged in user account by setting status value to 2'
      }
    },
    {
      method: 'PUT',
      path: '/users/status/{id}',
      options: {
        auth: 'jwt',
        handler: Controller.updateUserStatus,
        validate: {
          payload: {
            status: Joi.number().required()       
          }
        },
        tags: ['api', 'users'],
        description: 'Administrator update users account status by specified user account ID'
      }
    },
    {
      method: 'POST',
      path: '/users/me/send_code',
      options: {
        handler: Controller.sendVerificationCode,
        validate: {
          payload: {
            phone_number: Joi.string().required(),
            country_code: Joi.string().required()
          }
        },
        tags: ['api', 'users'],
        description: 'Sends verification code to the number provided. It\'ll delete all prior' +
        ' sended phone codes and save a new one. The limit to verify that phone code is within' +
        ' 2 mins from the time of creation. Before sending the SMS, it checks if this phone is' +
        ' associated to any other provider\'s phone. If on dev environment, it\'ll return the' +
        ' code in response to save the SMS and will be sent only on production',
        notes: 'Sends verification code to the given phone with country code'
      }
    },
    {
      method: 'PUT',
      path: '/users/me/verify_phone',
      options: {
        handler: Controller.verifyPhoneCode,
        validate: {
          payload: {
            code: Joi.string().required(),
          }
        },
        tags: ['api', 'users'],
        description: 'Does the verification of phone number. Requires the sent code to the phone' +
        ' The code should be entered within 2 mins from time of creation and after successfull ' +
        ' verification the code is deleted. After 2 mins the code expires and consumer have to generate' +
        ' it again.',
        notes: 'Verifies the user phone with given code'
      }
    },
  ]);
};
