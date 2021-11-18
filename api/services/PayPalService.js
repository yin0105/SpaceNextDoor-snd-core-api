const paypal = require('paypal-rest-sdk');
const shortid = require('shortid');

paypal.configure({
  'mode': process.env.PAYPAL_MODE || 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID || 'AbDc6PWKE7VaT2zjSVe8TlOQpwT1CX-qKs3XqaeTML3cfXHqwiDG6Vqcjl6OsKqx0rp25pxXv84BXwgL',
  'client_secret': process.env.PAYPAL_CLIENT_SECRET || 'EAgUXkcMTM5mwtkUpUdigp7g9tI54pts6ZcpGyQ7JcrW9DeIZZ5sak-0BsB_bLYUkbL89-2VSWvnRg-8'
});

/**
 * Create Single payout
 * then return payout detail if succeed
 * else return error.
 * 
 * @param payload payout details
 */
function createPayout(payload){
  
  const promise = new Promise((resolve, reject) => {

    const sender_batch_id = shortid.generate();
    console.log(sender_batch_id);
    const create_payout_json = {
      "sender_batch_header": {
        "sender_batch_id": sender_batch_id,
        "email_subject": "You have a payment"
      },
      "items": payload
    };

    const sync_mode = false;

    paypal.payout.create(create_payout_json, sync_mode, function (error, payout) {
      if (error) {
        console.log(error);
        return reject(error.response.message);
      } else {
        return resolve(payout);   //include payout batch ID
      }
    });

  });

  return promise;
}

/**
 * Get Paypal payout detail
 * then return detail if succeed
 * else return error.
 * 
 * @param id Payout batch ID
 */
function getPayout(id){
  
  const promise = new Promise((resolve, reject) => {

    paypal.payout.get(id, function (error, payout) {
      if (error) {
        console.log(error);
        return reject(error);
      } else {
        return resolve(payout);
      }

    });
  });

  return promise;
}

const service = {
  createPayout,
  getPayout
};


module.exports = service;
