const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');
const uuid = require('node-uuid');

const MessagesChannels = sequelize.define('ws_messages_channels', {
  customer_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  provider_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  channel: {
    type: Sequelize.STRING(255),
    allowNull: false,
    defaultValue: function () {
      return uuid.v1();
    }
  },
  archived: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

MessagesChannels.belongsTo(Users, {foreignKey: 'customer_id', as: 'customer'});
MessagesChannels.belongsTo(Users, {foreignKey: 'provider_id', as: 'provider'});

module.exports = MessagesChannels;
