const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('ws_provider_addons', {
  provider_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_providers',
      key: 'id'
    }
  },
  title: {
    type: Sequelize.STRING(500),
    allowNull: false
  },
  description: {
    type: Sequelize.STRING(1000),
    allowNull: true
  },
  addon_price: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
}, {
  tableName: 'ws_provider_addons',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});