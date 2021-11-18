'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_orders',
        'addons',
        Sequelize.STRING(100),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'ws_orders',
        'provider_hourly_rate',
        Sequelize.FLOAT,
        {
          allowNull: false
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_orders',
        'addons'
      ),
      queryInterface.removeColumn(
        'ws_orders',
        'provider_hourly_rate'
      )
    ];
  }
};
