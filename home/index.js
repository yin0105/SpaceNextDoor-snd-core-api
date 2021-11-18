exports.plugin = {
  register: (server) => {
  // Register all routes
    server.route([
      {
        method: 'GET',
        path: '/',
        config: {
          handler: {
            file: 'home/home.html'
          },
          tags: ['api'],
          description: 'Serve static home page for website',
          notes: 'Serve static home page'
        }
      },
      {
        method: 'GET',
        path: '/public/{param*}',
        handler: {
          directory: {
            path: 'public'
          }
        }
      }
    ]);
  },
  name: 'home'
};
