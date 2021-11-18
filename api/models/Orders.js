const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');
const Events = require('./Events');
const Users = require('./Users');
const Messages = require('./Messages');
const uuid = require('node-uuid');
const shortid = require('shortid');
const Reviews = require('./Reviews');
const Photos = require('./Photos');
const BookingStatuses = require('./BookingStatuses');
const Locations = require('./Locations');

const Orders = sequelize.define('ws_orders', {
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

  /** Info about Order */

  status_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    defaultValue: 1,
    references: {
      model: 'ws_booking_statuses',
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
  booking_date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: Sequelize.TIME,
    allowNull: false
  },
  start_utc: {
    type: Sequelize.DATE,
    allowNull: true
  },
  customer_phone: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  meeting_venue: {
    type: Sequelize.STRING(200),
    allowNull: false
  },
  group_size: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  event_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_events',
      key: 'id'
    }
  },
  booking_purpose: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  order_type: {
    type: Sequelize.STRING(20),
    defaultValue: 'hourly',
    allowNull: false
  },
  addons: {
    type: Sequelize.STRING(100),
    allowNull: true
  },

  /** Info about Photography */

  specialty: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  photography_style: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  no_of_hours: {
    type: Sequelize.FLOAT,
    allowNull: true
  },
  nature_of_shoot: {
    type: Sequelize.STRING(50),
    allowNull: true
  },
  shoot_vision: {
    type: Sequelize.STRING(200),
    allowNull: true
  },

  /** Info about Payments and Price */

  total_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  paid_amount: {
    type: Sequelize.FLOAT,
    allowNull: true
  },
  net_payable_amount: {
    type: Sequelize.FLOAT,
    allowNull: true
  },
  provider_receivable_amount: {
    type: Sequelize.FLOAT,
    allowNull: true
  },
  provider_hourly_rate: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  paid_to_provider: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: '0'
  },
  refund_amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  /** Info about discounts */

  discount_amount: {
    type: Sequelize.FLOAT,
    allowNull: true,
    defaultValue: '0.00'
  },
  // loyalty_program_id: {
  //   type: Sequelize.INTEGER(11),
  //   allowNull: true,
  //   references: {
  //     model: 'loyalty_programs',
  //     key: 'id'
  //   }
  // },
  loyalty_points_earned: {
    type: Sequelize.INTEGER(11),
    allowNull: true
  },

  /** Info about reviews */

  provider_review_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_reviews',
      key: 'id'
    }
  },
  customer_review_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_reviews',
      key: 'id'
    }
  },

  /** Others */

  messages_channel: {
    type: Sequelize.STRING(255),
    allowNull: false,
    defaultValue: function () {
      return uuid.v1();
    }
  },
  wandersnap_consent: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cancel_reason: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  cancelled_by_customer: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  cover_photo: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  share_code: {
    type: Sequelize.STRING(15),
    allowNull: true,
    defaultValue: function() {
      return shortid.generate();
    }
  },
  archive_url: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  paid_remark: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  invoices_id: {
    type: Sequelize.STRING(100),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'ws_orders'
});

Orders.belongsTo(Events, {foreignKey: 'event_id', as: 'event'});
Orders.belongsTo(BookingStatuses, {foreignKey: 'status_id', as: 'status'});
Orders.belongsTo(Locations, {foreignKey: 'location_id', as: 'location'});
Orders.belongsTo(Users, {foreignKey: 'provider_id', as: 'provider'});
Orders.belongsTo(Users, {foreignKey: 'customer_id', as: 'customer'});
Orders.belongsTo(Reviews, {foreignKey: 'provider_review_id', as: 'provider_review'});
Orders.belongsTo(Reviews, {foreignKey: 'customer_review_id', as: 'customer_review'});
Orders.hasMany(Photos, {foreignKey: 'order_id', as: 'images'});
Orders.hasMany(Messages, {foreignKey: 'order_id', as: 'messages'});

module.exports = Orders;
