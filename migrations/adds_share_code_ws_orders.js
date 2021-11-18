'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_orders',
        'share_code',
        Sequelize.STRING(15),
        {
          allowNull: true
        }
      ),
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_orders',
        'share_code'
      ),
    ];
  }
};
