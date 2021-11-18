const PhotographyStyles = require('../controllers/PhotographyStyles');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/photography_styles',
      options: {
        auth: false,
        handler: PhotographyStyles.getAll,
        tags: ['api', 'photography_styles'],
        description: 'Gets photography styles for photographers',
        notes: 'Gets photography styles for photographers, without auth'
      }
    },
  ]);
};
