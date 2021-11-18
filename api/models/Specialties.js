const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');


module.exports = sequelize.define('specialty', {
  name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  status: {
    type: Sequelize.INTEGER(4),
    allowNull: false
  }
}, {
  tableName: 'specialty',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
