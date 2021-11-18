const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const CouponUses = sequelize.define('ws_coupon_uses', {
  coupon_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_coupons',
      key: 'id'
    }
  },
  user_id:{
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  order_id:{
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_orders',
      key: 'id'
    }
  },
  value:{
    type: Sequelize.FLOAT,
    allowNull: false
  },
  use_dt: {
    type: Sequelize.DATE,
    allowNull: false
  }

}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = CouponUses;