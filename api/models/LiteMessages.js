const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');

const Messages= sequelize.define('ws_messages', {
  random_message_identifier: {
    type: Sequelize.INTEGER(15),
    allowNull: false
  },
  sender_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  receiver_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  channel: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  status: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '0'
  },
  alerted: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '0'
  }
}, {
  tableName: 'ws_lite_messages',
  timestamps: true,
  createdAt: 'created',
  updatedAt: 'modified'
});

Messages.belongsTo(Users, {foreignKey: 'sender_id', as: 'sender'});
Messages.belongsTo(Users, {foreignKey: 'receiver_id', as: 'receiver'});


module.exports = Messages;