'use strict';

const Boom = require('boom');
const LedgerService = require('../services/LedgerService');
const PaypalService = require('../services/PayPalService');
const Users = require('../models/Users');
const Providers = require('../models/Providers');
const Payouts = require('../models/Payouts');
const controller = {};

controller.createAccount = function(request, h) {

  const userId = request.payload.user_id; 

  return LedgerService.createAccount(userId)
    .then((result) => {
      return h.response(result);
    })
    .catch((err)=>{
      return Boom.internal(err);
    });
};

controller.getAccount = function(request, h) {

  const userId = request.params.user_id;

  return LedgerService.getAccount(userId)
    .then((result) => {
      return h.response(result);
    })
    .catch((err)=>{
      return Boom.internal(err);
    });
};

controller.createPayout = function(request, h) {

  const userId = request.params.user_id;
  //check pending payout
  return Payouts
    .findOne({
      where: {user_id: userId, status: 'PENDING'}
    })
    .then((payout)=>{

      //if not pending payout
      if (!payout) {
        //get provider payout data
        return Users.findOne({
          attributes: ['id', 'provider_id'],
          where: {id: userId},
          include: [{model: Providers, as: 'provider', attributes: ['id', 'payout_data']}]
        })
        .then((user) => {

          if (!user) {
            return Boom.notFound('Provider not found');
          }

          const payoutData = JSON.parse(user.provider.payout_data);

          if(payoutData.payout_method == 'paypal'){

            const accountId = 'provider'+userId;

            //get balance
            return LedgerService.getBalance(accountId)
              .then((result) => {

                if(result > 0){
                  // in USD
                  const amount = (result/100).toFixed(2);
                  const payload =[
                    {
                      "recipient_type": "EMAIL",
                      "amount": {
                        "value": amount,
                        "currency": "USD"
                      },
                      "receiver": payoutData.payout_identifier,
                      "note": "Payout for provider"+userId
                    }
                  ];

                  return PaypalService.createPayout(payload)
                    .then((result) => {

                      if(result.batch_header.batch_status == 'PENDING'){

                        const payoutTrans = {
                          user_id: userId,
                          account_id: 'provider'+userId,
                          paypal_id: payoutData.payout_identifier,
                          amount: amount,
                          batch_id: result.batch_header.payout_batch_id,
                          status: result.batch_header.batch_status
                        };

                        return Payouts.create(payoutTrans)
                        .then(()=>{
                          return h.response({ success: true, message: "Payout user ID "+userId+" was succeeded" });
                        })
                        .catch((e)=>{
                          return Boom.internal(e);
                        });
                      } else {
                        return Boom.badRequest("Unsuccessful payout, please try again");
                      }

                    })
                    .catch((err)=>{
                      return Boom.internal(err);
                    });
                } else {
                  return h.response({ success: false, message: "User ID "+userId+" has no left balance" });
                }
                
              })
              .catch((err)=>{
                return Boom.internal(err);
              });

          } else {
            return Boom.notFound('Provider not payable');
          }
          
        })
        .catch((err) => {
          return Boom.internal(err);
        });
      } else {
        return Boom.badRequest('There\'s pending payout for this provider');
      }

    })
    .catch((err) => {
      return Boom.internal(err);
    });
  
};

controller.getPayout = function(request, h) {

  const payoutId = request.params.payout_id;

  return PaypalService.getPayout(payoutId)
    .then((result) => {
      return h.response(result);
    })
    .catch((err)=>{
      return Boom.internal(err);
    });
};

module.exports = controller;
