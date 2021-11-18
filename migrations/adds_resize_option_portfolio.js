'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'portfolio_images',
      'resized_value',
      Sequelize.INTEGER(3),
      {
        allowNull: false,
        defaultValue: 1200
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ws_orders',
      'resized_value'
    );
  }
};
