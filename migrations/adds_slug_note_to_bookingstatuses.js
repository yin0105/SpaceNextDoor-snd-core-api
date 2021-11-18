'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_booking_statuses',
        'slug',
        Sequelize.STRING(25),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'ws_booking_statuses',
        'note',
        Sequelize.STRING(255),
        {
          allowNull: false
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_booking_statuses',
        'slug'
      ),
      queryInterface.removeColumn(
        'ws_booking_statuses',
        'note'
      )
    ];
  }
};
