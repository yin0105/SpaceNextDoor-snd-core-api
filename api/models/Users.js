const sequelize = require('../../config/sequelize');
const Providers = require('./Providers');
const Customers = require('./Customers');
const UsersLocations = require('./UsersLocations');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

const Users = sequelize.define('ws_users', {
  customer_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_customers',
      key: 'id'
    }
  },
  provider_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_providers',
      key: 'id'
    }
  },
  username: {
    type: Sequelize.STRING(255),
    validate: {
      is: ["[a-z]", 'i'], // will only allow letters
      max: 23
    },
    allowNull: true
  },
  first_name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  last_name: {
    type: Sequelize.STRING(255),
    allowNull: true
  },

  // Content related info
  cover: {
    type: Sequelize.STRING(500),
    allowNull: true
  },
  image: {
    type: Sequelize.STRING(255),
    allowNull: true
  },

  // auth related info
  password_hash: {
    type: Sequelize.STRING(300),
    allowNull: true
  },
  password_reset_token: {
    type: Sequelize.STRING(200),
    allowNull: true
  },
  reset_password_token_date: {
    type: Sequelize.DATE,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  email_verified: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  phone_country_code: {
    type: Sequelize.STRING(10),
    allowNull: true
  },
  phone: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  phone_verified: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  role: {
    type: Sequelize.INTEGER(2),
    defaultValue: 0, //customer 0, >10 provider, >20, admin
    allowNull: false
  },
  auth_provider: {
    type: Sequelize.STRING(20),
    allowNull: true
  },
  auth_provider_id: {
    type: Sequelize.STRING(40),
    allowNull: true
  },

  // common user info
  is_b2b: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  longitude: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  latitude: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  languages: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  other_language: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  status: {
    type: Sequelize.INTEGER(3),
    allowNull: false,
    defaultValue: 1       //1 means enable, 0 means disabled, 2 means pre signup
  },

  //subscriptions related info
  mail_chimp_suscribe_id: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  referral_codes_id: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
    references: {
      model: 'ws_referrals',
      key: 'id'
    }
  },
  // loyalty_program_id: {
  //   type: Sequelize.INTEGER(11),
  //   allowNull: true,
  //   references: {
  //     model: 'loyalty_programs',
  //     key: 'id'
  //   }
  // },
  loyalty_program_number: {
    type: Sequelize.STRING(255),
    allowNull: true
  },

  //payments
  credit: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  //others
  is_admin: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '0'
  },
  is_admin_restricted: {
    type: Sequelize.INTEGER(1),
    allowNull: false,
    defaultValue: '0'
  },
}, {
  tableName: 'ws_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Users.belongsTo(Providers, {foreignKey: 'provider_id', as: 'provider'});
Users.belongsTo(Customers, {foreignKey: 'customer_id', as: 'customer'});
Users.hasMany(UsersLocations, {foreignKey: 'user_id', as: 'locations'});

Users.prototype.comparePassword = function (candidatePassword) {
  let hash = this.password_hash && this.password_hash.replace('$2y$', '$2a$');
  const promise = new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
      if (err) {
        return reject(err);
      }
      return resolve(isMatch);
    });
  });
  return promise;
};

Users.prototype.toObject = function () {
  const object = this.toJSON();
  delete object.password_hash;
  return object;
};

module.exports = Users;
