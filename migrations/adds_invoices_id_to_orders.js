'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_orders',
        'invoices_id',
        Sequelize.STRING(100),
        {
          allowNull: true
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_orders',
        'invoices_id'
      )
    ];
  }
};
