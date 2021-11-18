'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ws_providers',
      'auto_payable',
      {
        type: Sequelize.INTEGER(1),
        allowNull: false,
        defaultValue: 0     
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ws_providers',
      'auto_payable'
    );
  }
};
