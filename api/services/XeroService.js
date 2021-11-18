'use strict';
const XeroNode = require('xero-node');
const Boom = require('boom');
const Stripe = require('./StripeService')
const Xero = new XeroNode.AccountingAPIClient({
  appType: "private",
  consumerKey: process.env.XERO_CONSUMER_KEY || "TT5DWAZVDRL7XBYGSTHCHH5QMGEVRQ",
  consumerSecret: process.env.XERO_CONSUMER_SECRET || "BIPTOBXG1JEARDG9TEWIAV1SJBPOEK",
  privateKeyPath: process.env.XERO_PRIVATE_KEY_PATH || "/app/key/privatekey.pem"
});

const payOrder = async (order, ref) => {
  // 2 cases of payment customer or admin pay booking
  // if customer pay, it always be Stripe,
  // so get charge and balance transaction detials from Stripe
  // if admin pay, admin have to supply required informations
  try {
    // customer pay booking
    if(ref.isStripeCharge){
      // get charge details (embed balance transaction details)
      const charge = await Stripe.getCharge(ref.transactionId);
      // console.log(charge);
      ref.amount = (charge.balance_transaction.net / 100).toFixed(2);
    }
    
    // create invoice
    const bookingDate = new Date(order.booking_date + " " + order.start_time);
    const createPayload = {
      "Type": "ACCREC",
      "Status": "AUTHORISED",
      "DueDate": bookingDate,
      "Contact": {
        "Name": "customer" + order.customer.id,
        "FirstName": order.customer.first_name,
        "LastName": order.customer.last_name,
        "EmailAddress": order.customer.email,
        "Phones": [
          {
            "PhoneType": "DEFAULT",
            "PhoneNumber": order.customer.phone,
            "PhoneCountryCode": order.customer.phone_country_code
          }
        ],
        "IsSupplier": false,
        "IsCustomer": true
      },
      "CurrencyCode": 'hkd',
      "LineAmountTypes": "Exclusive",
      "LineItems": [
        {
          "Description": "Booking ID " + order.id,
          "Quantity": "1",
          "UnitAmount": ref.amount,   // settled amount
          "AccountCode": "200"        // revenue
        }
      ]
    };
    const createResult = await Xero.invoices.create(createPayload);
    const invoice = createResult.Invoices[0];
    // console.log(createResult);

    // pay invoice
    const paymentPayload = {
      "Invoice": {
        "InvoiceID":  invoice.InvoiceID
      },
      "Account": {
        "AccountID": ref.xeroAccountId
      },
      "Date": new Date(),
      "Amount": ref.amount
    };
    const payResult = await Xero.payments.create(paymentPayload);
    // console.log(payResult);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getAccountId = async (accountName) => {
  try {
    const getAccounts = await Xero.accounts.get();
    const account = getAccounts.Accounts.filter((item) => {
      return item.Name == accountName;
    })[0];
    return account.AccountID;
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

const getAccounts = async () => {
  try {
    const getAccounts = await Xero.accounts.get();
    return getAccounts.Accounts;
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

module.exports = {
  payOrder,
  getAccountId,
  getAccounts
};
