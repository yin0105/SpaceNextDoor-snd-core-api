'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ws_orders',
      'messages_channel',
      Sequelize.STRING(255),
      {
        allowNull: false
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ws_orders',
      'messages_channel'
    );
  }
};
