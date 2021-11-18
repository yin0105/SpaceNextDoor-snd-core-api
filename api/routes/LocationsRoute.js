const LocationsController = require('../controllers/LocationsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/locations',
      options: {
        auth: false,
        handler: LocationsController.getAll,
        tags: ['api', 'locations'],
        description: 'Gets locations available in the platform',
        notes: 'Gets locations available in the platform, without auth'
      }
    },
  ]);
};
