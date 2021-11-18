const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const Transactions = sequelize.define('ws_transactions', {

  //source/destination of transaction 
  //value can be stripe | paypal | credit | coupon
  source: {
    type: Sequelize.STRING(30),
    allowNull: false
  },
  destination: {
    type: Sequelize.STRING(30),
    allowNull: false
  },

  //direction of transaction
  //value can be customer ID | provider ID | platform
  from: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  to: {
    type: Sequelize.STRING(100),
    allowNull: false
  },

  amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0.00
  },

  //other transaction info
  reference: {
    type: Sequelize.STRING(255),
    allowNull: true
  }

}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = Transactions;
