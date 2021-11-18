'use strict';
const sequence = require('sequence-sdk');
const Boom = require('boom');
const Users = require('../models/Users');
const Ledger = new sequence.Client({
  ledger: process.env.SEQUENCE_LEDGER || 'dev-ledger',
  credential: process.env.SEQUENCE_API_KEY || 'MDAwZWxvY2F0aW9uIAowMDM2aWRlbnRpZmllciAKEIWBAmaEDuS_iemZla2ZGGESBWJldGExGgsIqob31QUQ2PSNGAowMDE3Y2lkIAoMGgp3YW5kZXJzbmFwCjAwMmRjaWQgODUxMWY3YWEtODJmMS00ZWM5LTliMzEtZTgxYzc4MWU4ZjliCjAwNTF2aWQg9uf2weUEE-NmRcoAknXXOcngZeZBNe7L25kVaiYHLJD_RfvFSto7YShfDdaOQwEj_IahxEX51w3kCvF-uQGg_d6O9kbHbFfgCjAwMDhjbCAKMDAyZnNpZ25hdHVyZSC4Ebccv75rHgfCHeIcCLJzQ2btPKakzyBpZLW57NJfjAo'
});
const PROVIDER_ROLE = 10;

const getAccount = async (userId) => {
  try {
    const user = await Users.findOne({
      attributes: ['id', 'role'],
      where: {id: userId}
    });
    if (!user) {
      return Boom.notFound('user not found');
    }
    const userRole = parseInt(user.role);
    const isProvider = userRole >= PROVIDER_ROLE;
    const accountType = isProvider ? 'provider' : 'customer';
    const accountAlias = accountType + userId;
    // return only a first matched account
    const accounts = await Ledger.accounts.queryAll({
      filter: 'alias=$1',
      filterParams: [accountAlias]
    });

    return accounts[0];
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const createAccount = async (userId) => {
  try {
    const user = await Users.findOne({
      attributes: ['id', 'role'],
      where: {id: userId}
    });
    if (!user) {
      return Boom.notFound('user not found');
    }
    const userRole = parseInt(user.role);
    const isProvider = userRole >= PROVIDER_ROLE;
    const accountType = isProvider ? 'provider' : 'customer';
    const accountAlias = accountType + userId;
    // return created account information
    return await Ledger.accounts.create({
      alias: accountAlias,
      keys: [{alias: 'operations'}],
      tags: {type: accountType}
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const createProviderAccount = async (userId) => {
  try {
    return await Ledger.accounts.create({
      alias: 'provider' + userId,
      keys: [{alias: 'operations'}],
      tags: {type: 'provider'}
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const createCustomerAccount = async (userId) => {
  try {
    return await Ledger.accounts.create({
      alias: 'customer' + userId,
      keys: [{alias: 'operations'}],
      tags: {type: 'customer'}
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//build payment transactions customer pay order
//1.transfer from customer account to processing account 
//2.transfer from processing account to company account 
//3.transfer from processing account to provider account
/* example 
  payload = {
    customer_account: 'customer1091',      //existing customer account
    provider_account: 'provider230',       //existing provider account
    amount: 2400,                           //net payable amount (100*usd)
    provider_receivable: 2200,              //provider receivable amount
    platform_receivable: 200,               //platform receivable amount
    reference_data: {                       //customer payment reference  
      type: 'stripe_charge',
      charge_id: 'ch_xxxxxxtest3',
      token: 'tok_visa',
      order_id: 1991
    }
  }
*/ 
const createPaymentTransactions = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      if(payload.discount && payload.discount > 0) {
        builder.retire({
          assetAlias: 'promotion_usd',
          amount: payload.discount,
          sourceAccountAlias: payload.customer_account,
          referenceData: {
            type: 'redeem_credits',
            orderId: payload.order_id
          }
        });
      }
      builder.issue({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        destinationAccountAlias: payload.customer_account,
        referenceData: payload.reference_data
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        sourceAccountAlias: payload.customer_account,
        destinationAccountAlias: 'processing',
        referenceData: {
          type: 'fare_payment',
          orderId: payload.order_id
        }
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.platform_receivable,
        sourceAccountAlias: 'processing',
        destinationAccountAlias: 'company',
        referenceData: {
          type: 'company_fare_share',
          orderId: payload.order_id
        }
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.provider_receivable,
        sourceAccountAlias: 'processing',
        destinationAccountAlias: payload.provider_account,
        referenceData: {
          type: 'provider_fare_share',
          orderId: payload.order_id
        }
      });
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//build a payout transaction platform payout provider
//transfer from processing account to provider account
/* example
  payload = {
    provider_account: 'provider230',
    amount: 1800,                           //100*usd
    reference_data: {
      type: 'payout',
      payout_method: 'stripe',      
      payout_identifier: 'act_xxxxuieuee',
      payout_details: {
        type: 'auto_payout',
        source: 'stripe',
        charge_id: 'ch_xxxxxxtest3',
        order_id: 1991
      }
    }
  }
*/
const createPayoutTransactions = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.retire({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        sourceAccountAlias: payload.provider_account,
        referenceData: payload.reference_data
      });
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//build transactions customer pay order with credit
/* example
  payload = {
    customer_account: 'customer1091',       //existing customer account
    provider_account: 'provider230',        //existing provider account
    amount: 500,                            //credit redeem amount in 100*usd
    provider_receivable: 450,               //provider receivable amount
    platform_receivable: 50                 //platform receivable amount
  }
*/
const createIssueCreditTransactions = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.retire({
        assetAlias: 'promotion_usd',
        amount: payload.amount,
        sourceAccountAlias: payload.customer_account,
        referenceData: {
          type: 'redeem_credits',
          orderId: payload.order_id
        }
      });
      builder.issue({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        destinationAccountAlias: payload.customer_account,
        referenceData: {
          type: 'redeem_credits',
          orderId: payload.order_id
        }
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        sourceAccountAlias: payload.customer_account,
        destinationAccountAlias: 'processing',
        referenceData: {
          type: 'fare_payment',
          orderId: payload.order_id
        }
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.provider_receivable,
        sourceAccountAlias: 'processing',
        destinationAccountAlias: payload.provider_account,
        referenceData: {
          type: 'provider_fare_share',
          orderId: payload.order_id
        }
      });
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.platform_receivable,
        sourceAccountAlias: 'processing',
        destinationAccountAlias: 'company',
        referenceData: {
          type: 'company_fare_share',
          orderId: payload.order_id
        }
      });
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//transfer credit to customer account
/* example
  payload = {
    customer_account: 'customer1091',       //existing customer account
    amount: 1000,                           //credit amount in 100*usd
    reference_data: {
      type: 'promotion',
      campaign: 'referral'
    }
  }
*/
const distributeCredit = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.issue({
        assetAlias: 'promotion_usd',
        amount: payload.amount,
        destinationAccountAlias: payload.customer_account,
        referenceData: payload.reference_data
      });
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//get account balance
const getBalance = async (accountId) => {
  try {
    return await Ledger.balances.queryAll({
      filter: 'asset_alias=$1 AND account_alias=$2',
      filterParams: ['fare_usd', accountId],
      sumBy: ['account_id', 'asset_alias']
    })[0];
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//retire balance of provider account
/* example
  payload = {
    assetAlias: 'fare_usd',                  // retired asset 
    amount: 1000,                            // 100*usd 
    sourceAccountId: 'provider230',          // provider account
    referenceData: {
      system: 'paypal',                       // only paypal for now
      batch_id: '7ETHY73R7NX2C',              // PayPal payout batch id
      paypal_id: 'wsprovider@wandersnap.co'   // Receiver's PayPal account id
    }
  }
*/
const retireBalance = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.retire(payload);
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//customer refunds from company account
/* example
  payload = {
    assetAlias: 'fare_usd',                  // refunded asset 
    amount: 1000,                            // 100*usd 
    destinationAccountId: 'customer1091',    // customer account
    referenceData: {
      system: 'stripe',                         // only 'stripe' for now
      charge_id: 'ch_1CLu9NHfSt5TNH1VKLV2vMPk', // charge id
      refund_id: 're_1CLuADHfSt5TNH1V7GsFW0Ui'  // refund id
    }
  }
*/
const refund = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.issue(payload);
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//transfer fare back from provider to processing
//for setting booking vacant
/* example 
payload = {
  order_id: 1295,
  provider_id: 6,
  amount: 100
}
*/
const unassignProvider = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        sourceAccountAlias: 'provider' + payload.provider_id,
        destinationAccountAlias: 'processing',
        referenceData: {
          type: 'provider_fare_share',
          orderId: payload.order_id
        }
      });
    })
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

//transfer fare back from provider to processing
//for setting booking vacant
/* example 
payload = {
  order_id: 1295,
  provider_id: 6,
  amount: 100
}
*/
const assignProvider = async (payload) => {
  try {
    return await Ledger.transactions.transact((builder) => {
      builder.transfer({
        assetAlias: 'fare_usd',
        amount: payload.amount,
        sourceAccountAlias: 'processing',
        destinationAccountAlias: 'provider' + payload.provider_id,
        referenceData: {
          type: 'provider_fare_share',
          orderId: payload.order_id
        }
      });
    });
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const adminPayment = async (order, references) => {
  try {
    const chargeAmount = Math.round(order.net_payable_amount * 100);
    const providerReceivable = Math.round(order.provider_receivable_amount * 100);
    const discountAmount = (order.discount_amount > 0) ? Math.round(order.discount_amount * 100) : 0;
    const platformReceivable = (chargeAmount + discountAmount) - providerReceivable;
    const transactionAmount = chargeAmount + discountAmount;
    const transactionsData = {
      customer_account: 'customer' + order.customer_id,
      provider_account: 'provider' + order.provider_id,
      amount: transactionAmount,
      discount: discountAmount,
      provider_receivable: providerReceivable,
      platform_receivable: platformReceivable,
      order_id: order.id,
      reference_data: {        
        type: references.method,
        transaction_id: references.transactionId,
        order_id: order.id
      }
    };
    return await createPaymentTransactions(transactionsData);
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const customerPayToPlatform = async (order, charge) => {
  try {
    const providerReceivable = Math.round(order.provider_receivable_amount * 100);
    const discountAmount = (order.discount_amount > 0) ? Math.round(order.discount_amount*100) : 0;
    const platformReceivable = (charge.amount + discountAmount) - providerReceivable;
    const transactionAmount = charge.amount + discountAmount;
    const transactionsData = {
      customer_account: 'customer' + order.customer_id,
      provider_account: 'provider' + order.provider_id,
      amount: transactionAmount,
      discount: discountAmount,
      provider_receivable: providerReceivable,
      platform_receivable: platformReceivable,
      order_id: order.id,
      reference_data: {        
        type: 'stripe_charge',
        charge_id: charge.id,
        token: charge.token,
        order_id: order.id
      }
    };
    return await createPaymentTransactions(transactionsData);
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const providerAutoPayment = async (order, charge) => {
  try {
    const providerReceivable = Math.round(order.provider_receivable_amount * 100);
    const discountAmount = (order.discount_amount > 0) ? Math.round(order.discount_amount * 100) : 0;
    const platformReceivable = (charge.amount + discountAmount) - providerReceivable;
    const transactionAmount = charge.amount + discountAmount;
    const paymentTransactionsData = {
      customer_account: 'customer' + order.customer_id,
      provider_account: 'provider' + order.provider_id,
      amount: transactionAmount,
      discount: discountAmount,
      provider_receivable: providerReceivable,
      platform_receivable: platformReceivable,
      order_id: order.id,
      reference_data: {        
        type: 'stripe_charge',
        charge_id: charge.id,
        token: charge.token,
        order_id: order.id
      }
    };
    const payoutTransactionsData = {
      provider_account: 'provider' + order.provider_id,
      amount: providerReceivable,
      reference_data: {        
        type: 'payout',
        payout_method: 'stripe',      
        payout_identifier: charge.payoutIdentifier,
        payout_details: {
          type: 'auto_payout',
          source: 'stripe',
          charge_id: charge.id,
          order_id: order.id
        }
      }
    };
    const result = await createPaymentTransactions(paymentTransactionsData);
    await createPayoutTransactions(payoutTransactionsData);
    return result;
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

module.exports = {
  getAccount,
  createAccount,
  createCustomerAccount,
  createProviderAccount,
  createPaymentTransactions,
  createPayoutTransactions,
  createIssueCreditTransactions,
  distributeCredit,
  getBalance,
  retireBalance,
  refund,
  unassignProvider,
  assignProvider,
  adminPayment,
  customerPayToPlatform,
  providerAutoPayment
};
