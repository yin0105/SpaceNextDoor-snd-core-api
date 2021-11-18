const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const Coupons = sequelize.define('ws_coupons', {
  code: {
    type: Sequelize.STRING(25)
  },
  value_fixed:{
    type: Sequelize.FLOAT,
    allowNull: true
  },
  value_percent:{
    type: Sequelize.FLOAT,
    allowNull: true
  },
  expired: {
    type: Sequelize.DATE
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = Coupons;
