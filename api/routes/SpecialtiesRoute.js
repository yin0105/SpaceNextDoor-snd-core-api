const SpecialtiesController = require('../controllers/SpecialtiesController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/specialties',
      options: {
        auth: false,
        handler: SpecialtiesController.getAll,
        tags: ['api', 'specialties'],
        description: 'Gets specialties for photographers',
        notes: 'Gets specialties for photographers, without auth'
      }
    },
  ]);
};
