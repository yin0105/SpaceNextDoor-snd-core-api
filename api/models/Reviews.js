const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Users = require('./Users');

const Reviews = sequelize.define('ws_reviews', {
  reviewed_by: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  review_for: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    references: {
      model: 'ws_users',
      key: 'id'
    }
  },
  order_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    // references: {
    //   model: 'ws_orders',
    //   key: 'id'
    // }
  },
  rating: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: '0'
  },
  review: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  tableName: 'ws_reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Reviews.belongsTo(Users, {foreignKey: 'reviewed_by', as: 'reviewer'});
Reviews.belongsTo(Users, {foreignKey: 'review_for', as: 'user'});

module.exports = Reviews;