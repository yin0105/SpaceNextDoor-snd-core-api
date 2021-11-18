'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'snapventure_user_photos',
        'camera_type',
        Sequelize.STRING(255),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'snapventure_user_photos',
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
        'snapventure_user_photos',
        'camera_type'
      ),
      queryInterface.removeColumn(
        'snapventure_user_photos',
        'tags'
      )
    ];
  }
};
