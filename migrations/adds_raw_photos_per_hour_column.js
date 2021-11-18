'use strict';

module.exports = {

  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('ws_providers', 'raw_photos_per_hour', Sequelize.INTEGER(3));
  },
 
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('ws_providers', 'raw_photos_per_hour');
  }
};