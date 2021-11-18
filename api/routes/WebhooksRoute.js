const WebhooksController = require('../controllers/WebhooksController');

module.exports = function (server, options, next) {

  server.route([

    //clear PayPal payout transaction
    {
      method: 'POST',
      path: '/webhooks/paypal_status',
      options: {
        auth: false,
        handler: WebhooksController.paypalStatus,
        tags: ['api', 'webhooks'],
        description: 'Clear PayPal payout transaction by payout batch ID',
        notes: 'Clear PayPal payout transaction by payout batch ID'
      }
    }
    
  ]);

};