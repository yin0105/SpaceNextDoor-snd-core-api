const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('ws_photography_styles', {
  name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
}, {
  tableName: 'ws_photography_styles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
