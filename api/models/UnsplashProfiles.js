const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');

const UnsplashProfiles = sequelize.define('ws_unsplash_profiles', {
  username: {
    type: Sequelize.STRING(255),
    unique: true,
    allowNull: false
  },
  first_name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  last_name: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  insta_username: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  twitter_username: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  website_link: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  profile_img: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  total_likes: {
    type: Sequelize.INTEGER(),
    defaultValue: 0
  },
  total_photos: {
    type: Sequelize.INTEGER(),
    defaultValue: 0
  },
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = UnsplashProfiles;
