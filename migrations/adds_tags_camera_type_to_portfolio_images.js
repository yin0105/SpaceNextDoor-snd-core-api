'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'portfolio_images',
        'camera_type',
        Sequelize.STRING(255),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'portfolio_images',
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
        'portfolio_images',
        'cameara_type'
      ),
      queryInterface.removeColumn(
        'portfolio_images',
        'tags'
      )
    ];
  }
};
