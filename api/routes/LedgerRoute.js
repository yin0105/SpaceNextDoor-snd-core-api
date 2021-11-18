const Joi = require('joi');
const LedgerController = require('../controllers/LedgerController');

module.exports = function (server, options, next) {

  server.route([

    //create account
    {
      method: 'POST',
      path: '/ledger/account',
      options: {
        auth: 'jwt',
        handler: LedgerController.createAccount,
        validate:{
          payload :{
            user_id: Joi.number().required()
          }
        },
        tags: ['api', 'ledger'],
        description: 'Create ledger account',
        notes: 'Create customer or provider ledger account under the key "operations"'
      }
    },

    //get account
    {
      method: 'GET',
      path: '/ledger/{user_id}/account',
      options: {
        auth: 'jwt',
        handler: LedgerController.getAccount,
        validate: {
          params: {
            user_id: Joi.number().required(),
          }
        },
        tags: ['api', 'ledger'],
        description: 'Get ledger account',
        notes: 'Get customer or provider ledger account under the key "operations"'
      }
    },

    //payout
    {
      method: 'POST',
      path: '/ledger/{user_id}/payout',
      options: {
        auth: 'jwt',
        handler: LedgerController.createPayout,
        validate: {
          params: {
            user_id: Joi.number().required(),
          }
        },
        tags: ['api', 'ledger'],
        description: 'Create payout to provider',
        notes: 'Create a payout to provider and record to ledger'
      }
    },

    //get payout status
    {
      method: 'GET',
      path: '/ledger/{payout_id}/payout',
      options: {
        auth: 'jwt',
        handler: LedgerController.getPayout,
        validate: {
          params: {
            payout_id: Joi.string().required(),
          }
        },
        tags: ['api', 'ledger'],
        description: 'Get PayPal payout details by payout batch ID',
        notes: 'Get PayPal payout details by payout batch ID'
      }
    }

  ]);

};
