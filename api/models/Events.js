const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const Events = sequelize.define('ws_events', {
  title: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  description: {
    type: Sequelize.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  banner: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  overlay_image: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  facebook_page: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  facebook_page_name: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  water_marker_logo: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  water_marker_position: {
    type: Sequelize.STRING(20),
    allowNull: true,
    defaultValue: 'bottomRight' //bottomRight, bottomLeft
  },
  location: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  longitude: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  latitude: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  sponsors: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  organisers: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = Events;
