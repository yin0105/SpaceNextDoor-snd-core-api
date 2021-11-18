const Transactions = require('../models/Transactions');
const request = require('request');
const fs = require('fs');


/**
 * Create a transaction for customer pay to platform
 * return nothing when succeed otherwise return error message
 * @param payload payment details
 * 
 */
function customerPayOrderToPlatform(payload) {
  const transactionsData = {
    source: 'stripe',
    destination: 'platform',
    from: payload.customer_id,
    to: 'wandersnap',
    amount: payload.amount,
    reference: JSON.stringify(payload)
  };

  return Transactions.create(transactionsData);
}

function customerPayOrderToProvider(payload) {
  const transactionsData = [{
    source: 'stripe',
    destination: 'platform',
    from: payload.customer_id,
    to: 'wandersnap',
    amount: (payload.amount - payload.dstAmount),
    reference: JSON.stringify(payload)
  },{
    source: 'stripe',
    destination: 'provider',
    from: payload.customer_id,
    to: payload.provider_id,
    amount: payload.dstAmount,
    reference: JSON.stringify(payload)
  }];

  return Transactions.bulkCreate(transactionsData);  
}

function couponTransaction(payload) {
  const transactionsData = {
    source: 'credit',
    destination: 'platform',
    from: 'marekting',
    to: 'wandersnap',
    amount: payload.amount,
    reference: JSON.stringify(payload)
  };

  return Transactions.create(transactionsData);
}

/**
 * Create a transacetion for customer signup with referral code transaction
 * return nothing when succeed otherwise return error message
 * 
 * @param payload signup detail
 */
function userSignupWithReferralCode(payload) {
  const transactionsData = [{
    source: 'platform',
    destination: 'credit',
    from: 'wandersnap',
    to: payload.referred_user_id,
    amount: payload.amount,
    reference: JSON.stringify(payload)
  },{
    source: 'platform',
    destination: 'credit',
    from: 'wandersnap',
    to: payload.user_id,
    amount: payload.amount,
    reference: JSON.stringify(payload)
  }];

  return Transactions.bulkCreate(transactionsData);
}


const service = {
  customerPayOrderToPlatform,
  customerPayOrderToProvider,
  userSignupWithReferralCode,
  couponTransaction
};

module.exports = service;