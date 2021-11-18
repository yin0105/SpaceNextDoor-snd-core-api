'use strict';

module.exports = {

  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('ws_providers', 'payout_data', Sequelize.TEXT());
  },
 
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('ws_providers', 'payout_data');
  }
};