'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_orders',
        'cover_photo',
        Sequelize.STRING(255),
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
        'cover_photo'
      ),
    ];
  }
};
