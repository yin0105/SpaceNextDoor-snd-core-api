const config = {};

config.SITE_URL = process.env.WANDERSNAP_SITE_URL || 'http://moon.wandersnap.co';
config.SERVICE_FEE_RATE = 0.20; // 20 percent   
config.WANDERSNAP_DEDUCTION_RATE = 0.10; // 10 percent
config.REFERRAL_SIGNUP_BONUS = 15; // US$
config.FORGOT_PASSWORD_TOKEN_EXPIRE_LIMIT = 24; //24h
config.WANDERSNAP_CREW_USER_ID = 1;
config.ADMIN_EMAIL = 'hey@wandersnap.co';

module.exports = config;