const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');


const Photos = sequelize.define('ws_photos', {
  order_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'ws_orders',
      key: 'id'
    }
  },
  width: {
    type: Sequelize.INTEGER
  },
  height: {
    type: Sequelize.INTEGER
  },
  name: {
    type: Sequelize.STRING
  },
  path: {
    type: Sequelize.STRING,
    unique: true //path needs to be unique throughout the db
  },
  is_visible: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  camera_type: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  tags: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Photos;
