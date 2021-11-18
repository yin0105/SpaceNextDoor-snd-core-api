const envKey = key => {
  const env = process.env.NODE_ENV || 'localDevelopment';

  const configuration = {
    localDevelopment: {
      host: 'localhost',
      port: 8000
    },
    development: {
      host: '0.0.0.0',
      port: 8000
    },
    // These should match environment variables on hosted server
    production: {
      host: '0.0.0.0',
      port: 8000
    }
  };

  return configuration[env][key];
};

const manifest = {
  server: {
    host: envKey('host'),
    port: envKey('port'),
    routes: {
      cors: {
        headers: ["Authorization", "Content-Type", "Cache-Control", "x-requested-with", "authorization", "cache-control"]
      }
    },
    router: {
      stripTrailingSlash: true
    }
  },
  register: {
    plugins: [
      {
        plugin: 'bell'
      },
      {
        plugin: 'inert'
      },
      {
        plugin: 'vision'
      },
      {
        plugin: 'hapi-auth-jwt2'
      },
      {
        plugin: './api/middleware'
      },
      {
        plugin: './api',
        routes: {
          prefix: '/api'
        }
      },
      {
        plugin: './home'
      },
      {
        plugin: 'hapi-raven',
        options: {
          dsn: process.env.SENTRY_DSN,
        },
      },
      {
        plugin: 'good',
        options: {
          ops: { interval: 60000 },
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{response: '*', error: '*' }]
              },
              {
                module: 'good-console'
              },
              'stdout'
            ]
          }
        }
      },
      {
        plugin: 'hapi-swagger',
        options: {
          schemes: ["https", "http"],
          grouping: 'tags',
          tags: [
            { name: 'customers', description: 'Customer related endpoints'  },
            { name: 'auth', description: 'Auth related endpoints'  },
            { name: 'deals', description: 'Deals related endpoints'  },
            { name: 'orders', description: 'Orders related endpoints'  },
            { name: 'categories', description: 'Categories related endpoints'  },
            { name: 'media', description: 'Media upload related endpoints'  },
            { name: 'shops', description: 'Shops related endpoints'  },
            { name: 'providers', description: 'Customer related endpoints'  }
          ]
        }
      }
    ]
  }
};

module.exports = manifest;
