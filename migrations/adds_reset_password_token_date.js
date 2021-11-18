'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
        'ws_users',
        'reset_password_token_date',
        Sequelize.DATE,
        {
          allowNull: true
        }
      )
    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn(
        'ws_users',
        'reset_password_token_date'
      ),
    ];
  }
};
