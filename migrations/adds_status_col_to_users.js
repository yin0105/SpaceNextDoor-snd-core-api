'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ws_users',
      'status',
      {
        type: Sequelize.INTEGER(3),
        allowNull: false,
        defaultValue: 1     
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ws_users',
      'status'
    );
  }
};
