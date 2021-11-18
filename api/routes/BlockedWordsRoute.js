const Controller = require('../controllers/BlockedWordsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/words',
      options: {
        auth: false,
        handler: Controller.getAll,
        tags: ['api', 'words'],
        description: 'Get all blocked words',
        notes: 'Get all blocked words'
      }
    }
  ]);
};
