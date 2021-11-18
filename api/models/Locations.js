const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('locations', {
  title: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  country: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  timezone: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  key: {
    type: Sequelize.STRING(30),
    allowNull: false
  },
  status: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '1'
  },
  image: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  lat: {
    type: Sequelize.DECIMAL(8),
    allowNull: true
  },
  lon: {
    type: Sequelize.DECIMAL(8),
    allowNull: true
  }
}, {
  tableName: 'locations',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});
