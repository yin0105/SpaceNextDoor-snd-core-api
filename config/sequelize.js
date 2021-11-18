
var Sequelize = require('sequelize');

const db = process.env.WS_PROD_DB;
const host = process.env.WS_PROD_DB_HOST;
const password = process.env.WS_PROD_DB_PASS;
const user = process.env.WS_PROD_DB_USER;

// The db connected here is dev db infact, too lazy to change the naming right now, Chillax!!
const sequelize = new Sequelize(db || 'ws_dev', user || 'wandersnap_prod', password || 'u5m*C.b:3B`[.:~`8W', {
  host: host || 'dev-db-sg.cmaqmm2ewm0u.ap-southeast-1.rds.amazonaws.com',
  port: db ? '3306' : '3350',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }

});
sequelize
 .authenticate()
  .then(() => {
    console.log('Whaaaat? Im connected?');
    sequelize.sync();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
