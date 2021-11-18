const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const ProviderCancellationPolicies = sequelize.define('ws_provider_cancellation_policies', {
  days_to_cancel_before: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  cancel_penalty_percent: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  no_show_penalty_percent: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false, //path needs to be unique throughout the db
    unique: true
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProviderCancellationPolicies;
