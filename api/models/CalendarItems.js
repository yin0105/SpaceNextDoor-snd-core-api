const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const BookingStatuses = sequelize.define('ws_calendar_items', {
  type: { //NOT_AVAILABLE
    type: Sequelize.STRING(25),
    defaultValue: 'NOT_AVAILABLE',
    allowNull: false
  },
  start: {
    type: Sequelize.DATE,
    allowNull: false
  },
  end: {
    type: Sequelize.DATE,
    allowNull: false
  },
  user_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  tableName: 'ws_calendar_items'
});

module.exports = BookingStatuses;
