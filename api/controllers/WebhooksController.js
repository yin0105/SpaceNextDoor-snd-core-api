' use strict';
const Boom = require('boom');
const LedgerService = require('../services/LedgerService');
const Payouts = require('../models/Payouts');
const paypalToken = process.env.PAYPAL_TOKEN || "c248aacfa373432eb68e34a4c1ca1dc5";
const controller = {};


controller.paypalStatus = function(request, h) {

  if(request.query.token !== paypalToken ) { 
    return Boom.unauthorized(); 
  }

  const payoutId = request.payload.resource && request.payload.resource.payout_batch_id;
  const status = request.payload.resource && request.payload.resource.transaction_status;

  //get pending payout from DB
  return Payouts.findOne({
    where: {batch_id: payoutId}
  })
  .then((payout) => {

    if(!payout){
      return Boom.notFound('Transaction not found');
    }

    if(payout.status == 'PENDING'){
      
      //pending payout continue update status
      return Payouts.update({
        status: status
      }, {
        where: {
          id: payout.id
        }
      })
      .then(() => {

        //retire balance if payout success
        if(status == 'SUCCESS'){

          const payload = {
            assetAlias: 'fare_usd',
            amount: 100*payout.amount,
            sourceAccountId: payout.account_id,
            referenceData: {
              system: 'paypal',
              batch_id: payout.batch_id,
              paypal_id: payout.paypal_id
            }
          };

          return LedgerService.retireBalance(payload)
            .then(() => {
              return h.response({success:true,message:"Payout transaction ID "+payout.id+" was cleared"});
            })
            .catch((err)=>{
              console.log(err);
              return Boom.badRequest(err);
            });
        }

      })
      .catch((e) => {
        return Boom.internal(e);
      });

    } else {
      return Boom.badRequest('Transaction was done');
    }

  })
  .catch((e) => {
    return Boom.internal(e);
  });  
  
};

module.exports = controller;
