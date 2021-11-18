const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

module.exports = sequelize.define('ws_phone_ver_codes', {
  code: {
    type: Sequelize.STRING(6),
    allowNull: false
  },
  user_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  phone_number: {
    type: Sequelize.STRING(15),
    allowNull: false
  },
  country_code: {
    type: Sequelize.STRING(5),
    allowNull: false
  }
}, {
  tableName: 'ws_phone_ver_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
