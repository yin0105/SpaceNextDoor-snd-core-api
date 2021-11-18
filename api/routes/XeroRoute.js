const XeroController = require('../controllers/XeroController');

module.exports = (server, options) => {
  server.route([
    // get accounts
    {
      method: 'GET',
      path: '/xero/accounts',
      options: {
        auth: 'jwt',
        handler: XeroController.getAccounts,
        tags: ['api', 'xero'],
        description: 'Get Xero accounts',
        notes: 'Get Xero accounts'
      }
    }
  ]);
};