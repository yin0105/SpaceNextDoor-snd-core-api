'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'portfolio_images',
        'height',
        Sequelize.INTEGER(3),
        {
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'portfolio_images',
        'width',
        Sequelize.INTEGER(3),
        {
          allowNull: false
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'portfolio_images',
        'height'
      ),
      queryInterface.removeColumn(
        'portfolio_images',
        'width'
      )
    ];
  }
};
