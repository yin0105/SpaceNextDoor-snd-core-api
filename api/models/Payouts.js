const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');

const Payouts = sequelize.define('ws_payouts', {
  user_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  account_id:{
    type: Sequelize.STRING,
    allowNull: false
  },
  paypal_id:{
    type: Sequelize.STRING,
    allowNull: false
  },
  amount:{
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0.00
  },
  batch_id:{
    type: Sequelize.STRING,
    allowNull: false
  },
  status:{
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at'
});

Payouts.belongsTo(Users, {foreignKey: 'user_id', as: 'provider'});

module.exports = Payouts;
