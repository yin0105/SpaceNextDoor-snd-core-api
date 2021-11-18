const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');
const ProviderPortfolioImages = require('./ProviderPortfolioImages');

const FavoriteImages = sequelize.define('ws_favorite_images', {
  user_id: { //id of the user who favourited
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  image_id: { //id of the favorite image
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_portfolio_images',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at'
});

FavoriteImages.belongsTo(Users, {foreignKey: 'user_id', as: 'user'});
FavoriteImages.belongsTo(ProviderPortfolioImages, {foreignKey: 'image_id', as: 'image'});

module.exports = FavoriteImages;
