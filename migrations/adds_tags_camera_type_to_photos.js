'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_photos',
        'camera_type',
        Sequelize.STRING(255),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'ws_photos',
        'tags',
        Sequelize.TEXT,
        {
          allowNull: true
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_photos',
        'cameara_type'
      ),
      queryInterface.removeColumn(
        'ws_photos',
        'tags'
      )
    ];
  }
};
