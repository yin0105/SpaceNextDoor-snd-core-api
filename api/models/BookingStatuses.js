const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const BookingStatuses = sequelize.define('ws_booking_statuses', {
  name: {
    type: Sequelize.STRING(25),
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING(25),
    allowNull: true
  },
  note: {
    type: Sequelize.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  tableName: 'ws_booking_statuses'
});

module.exports = BookingStatuses;
