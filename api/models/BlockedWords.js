const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const BlockedWords = sequelize.define('ws_blocked_words', {
  word: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  tableName: 'ws_blocked_words'
});

module.exports = BlockedWords;
