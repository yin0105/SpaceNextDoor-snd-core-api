const CancellationPoliciesController = require('../controllers/CancellationPoliciesController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/cancellation_policies',
      options: {
        auth: false,
        handler: CancellationPoliciesController.getAll,
        tags: ['api', 'cancellation_policies'],
        description: 'Gets cancellation policies for photographers',
        notes: 'Gets canlleation policies for photographers, without auth'
      }
    },
  ]);
};
