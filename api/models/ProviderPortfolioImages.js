const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('ws_portfolio_images', {
  user_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  width: {
    type: Sequelize.INTEGER(3),
    allowNull: true
  },
  height: {
    type: Sequelize.INTEGER(3),
    allowNull: true
  },
  resized_value: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1200
  },
  link: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  camera_type: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  tags: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ws_portfolio_images',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});