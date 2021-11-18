const sequelize = require('../../config/sequelize');
const Sequelize = require('sequelize');


const ReferralCodes = sequelize.define('ws_referrals', {
  referral_code: {
    type: Sequelize.STRING
  },
  referrer_user_id: {
    type: Sequelize.INTEGER
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = ReferralCodes;

