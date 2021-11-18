const SitemapController = require('../controllers/SitemapController');

module.exports = (server, options) => {
  server.route([
    // get accounts
    {
      method: 'GET',
      path: '/sitemap',
      options: {
        auth: false,
        handler: SitemapController.getSitemap,
        tags: ['api', 'sitemap'],
        description: 'Generates sitemap and returns XML',
        notes: 'Generates sitemap and returns XML'
      }
    }
  ]);
};