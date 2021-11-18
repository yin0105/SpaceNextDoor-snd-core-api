const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const ExchangeRates = sequelize.define('ws_exchange_rates', {
  currency: {
    type: Sequelize.STRING,
    allowNull: false
  },
  rate:{
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ExchangeRates;
