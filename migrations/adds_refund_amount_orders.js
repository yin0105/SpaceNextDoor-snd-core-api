'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ws_orders',
      'refund_amount',
      {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ws_orders',
      'refund_amount'
    );
  }
};
