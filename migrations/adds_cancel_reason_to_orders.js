'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_orders',
        'cancel_reason',
        Sequelize.TEXT,
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'ws_orders',
        'cancelled_by_customer',
        Sequelize.BOOLEAN,
        {
          allowNull: false,
          defaultValue: false
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_orders',
        'cancel_reason'
      ),
      queryInterface.removeColumn(
        'ws_orders',
        'cancelled_by_customer'
      )
    ];
  }
};
