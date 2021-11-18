'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_providers',
        'profile_completed',
        Sequelize.BOOLEAN,
        {
          defaultValue: false
        }
      ),
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_providers',
        'profile_completed'
      )
    ];
  }
};
