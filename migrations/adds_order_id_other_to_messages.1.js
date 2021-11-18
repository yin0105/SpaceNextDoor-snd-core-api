'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'messages',
        'order_id',
        Sequelize.INTEGER(11),
        {
          allowNull: false
        }
      ),
      queryInterface.addColumn(
        'messages',
        'channel',
        Sequelize.STRING(255),
        {
          allowNull: false
        }
      ),
      queryInterface.addColumn(
        'messages',
        'random_message_identifier',
        Sequelize.INTEGER(15),
        {
          allowNull: false
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'messages',
        'order_id',
      ),
      queryInterface.removeColumn(
        'messages',
        'channel',
      ),
      queryInterface.removeColumn(
        'messages',
        'random_message_identifier',
      )
    ]
  }
};
