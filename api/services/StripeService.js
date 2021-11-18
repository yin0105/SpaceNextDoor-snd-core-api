'use strict';

const STRIPE_API_KEY = process.env.STRIPE_API_KEY || 'sk_test_bA3VQHuRKpTT71gH6vNo7DYn';
const stripe = require('stripe')(STRIPE_API_KEY);

/**
 * Create Stripe charge
 * then return charge detail if succeed
 * else return error.
 * 
 * @param payload payment details (payment payload)
 */
const charge = async (payload) => {
  return await stripe.charges.create(payload);
};

/**
 * Get Stripe charge
 * then return charge detail if succeed
 * else return error.
 * 
 * @param id Stripe charge ID
 */
const getCharge = async (id) => {
  const charge = await stripe.charges.retrieve(id);
  const transId = charge.balance_transaction;
  charge.balance_transaction = await getBalanceTransaction(transId);
  return charge;
};

/**
 * Get Stripe balance transaction
 * then return transaction detail if succeed
 * else return error.
 * 
 * @param id Stripe balance transaction ID
 */
const getBalanceTransaction = async (id) => {
  return await stripe.balance.retrieveTransaction(id);
}

/**
 * Create Stripe refund
 * then return charge detail if succeed
 * else return error.
 * 
 * @param payload = {
    charge: ch_xxxxx,
    amount: 100
  }
 * 
 */
const refund = async (payload) => {
  return await stripe.refunds.create(payload);
};

module.exports = {
  charge,
  getCharge,
  getBalanceTransaction,
  refund
};
