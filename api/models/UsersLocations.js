const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Locations = require('./Locations');

const UsersLocations = sequelize.define('ws_users_locations', {
  user_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  location_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'locations',
      key: 'id'
    }
  },
}, {
  tableName: 'ws_users_locations',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

UsersLocations.belongsTo(Locations, {foreignKey: 'location_id', as: 'location'});

module.exports = UsersLocations;