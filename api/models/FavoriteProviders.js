const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');

const FavoriteProviders = sequelize.define('ws_favorite_providers', {
  user_id: { //id of the user who favourited
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  favorited: { //id of the user who was favorited 
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at'
});

FavoriteProviders.belongsTo(Users, {foreignKey: 'user_id', as: 'user'});
FavoriteProviders.belongsTo(Users, {foreignKey: 'favorited', as: 'provider'});

module.exports = FavoriteProviders;
