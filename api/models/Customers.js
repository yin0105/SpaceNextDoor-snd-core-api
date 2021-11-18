const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('ws_customers', {
  favourite_providers: {
    type: Sequelize.STRING(255),
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'ws_customers',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});
