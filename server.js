'use strict';
const Glue = require('glue');
const manifest = require('./config/manifest');
require('./config/sequelize');

// process.argv.push('--harmony_destructuring');
if (!process.env.PRODUCTION) {
  manifest.register.plugins.push({
    plugin: 'blipp',
    options: {}
  });
}

const startServer = async function() {
  const server = await Glue.compose(manifest, { relativeTo: __dirname });
  try {
    await server.start();
    console.log('Sxerver is listening on ' + server.info.uri.toLowerCase());
  }
  catch (err) {
    console.error('Error while starting server: ', err);
    process.exit(1);
  }
};

startServer();