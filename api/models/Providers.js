const sequelize = require('../../config/sequelize');
const ProviderAddOns = require('./ProviderAddOns');
const ProviderCancellationPolicies = require('../models/ProviderCancellationPolicies');
const Sequelize = require('sequelize');

const Providers = sequelize.define('ws_providers', {
  title: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  about: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  note: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  is_featured: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  profile_completed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  visible_in_search: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  payout_data: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  feature_order: {
    type: Sequelize.INTEGER(5),
    allowNull: false,
    defaultValue: '0'
  },
  company_name: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  specialty: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  hourly_rate: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  per_day_rate: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  extra_edit_cost: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  raw_photos_per_hour: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1
  },
  edits_per_hour: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1
  },
  min_hours_for_booking: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1
  },
  max_group_size: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1
  },
  delivery_time: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 0
  },
  camera_type: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  languages: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  website_link: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  social_media_links: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  cancellation_policy_id : {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  auto_payable: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '0'
  }
}, {
  tableName: 'ws_providers',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

Providers.hasMany(ProviderAddOns, {foreignKey: 'provider_id', as: 'addons'});
Providers.belongsTo(ProviderCancellationPolicies, {foreignKey: 'cancellation_policy_id', as: 'cancellation_policy'});

module.exports = Providers;
