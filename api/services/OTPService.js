const PhoneVerificationCodes = require('../models/PhoneVerificationCodes');
const twilio = require('twilio');


/**
 * Create a phone verification code for the given phone number
 * with the given verification type.
 * The generated code has 6 digits.
 * @param number
 * @param countryCode 2 digit country code
 */
function createPhoneCode(number, countryCode, userId) {
  const accountSid = process.env.WS_TWILIO_SID || 'ACa08ae60b6969be773fdf9d5e42dbe702';
  const authToken = process.env.WS_TWILIO_TOKEN || '1f80a2670c09d34a51992d8279c1d4b5';
  const fromPhoneNumber = process.env.WS_TWILIO_NUMBER || '+15005550006';
  const code = service.generateRandomCode();
  const promise = new Promise((resolve, reject) => {
    // first remove all previous codes associated with this phone and type
    PhoneVerificationCodes.destroy({
      where: {
        user_id: userId
      }
    })
    .then(() => {
      PhoneVerificationCodes.create({
        phone_number: number,
        country_code: countryCode,
        code, user_id: userId
      })
      .then(() => {
        if (process.env.NODE_ENV !== 'production') {
          //On Dev Send code in response so we don't waste SMS
          return resolve({success: true, code});
        } else {
          const client = new twilio(accountSid, authToken);
          client.messages.create({
            body: `To confirm your phone number on WanderSnap, please input this code: ${code}`,
            to: countryCode + number,  // SMS to this number
            from: fromPhoneNumber // From a valid Twilio number
          })
          .then(() => {
            return resolve({success: true});
          })
          .catch((err) => {
            return reject(err);
          });
        }
      })
      .catch((err) => {
        return reject(err);
      });
    })
    .catch((err) => {
      return reject(err);
    });
  });
  return promise;
}

/**
 * Find a phone verification code for the given phone number.
 * @param number
 * @param type ['SIGN_UP', 'RESET_PASS', 'VERIFY_OAUTH_SIGNUP']
 * @param code
 */
function verifyCode(userId, code) {
  const promise = new Promise((resolve, reject) => {

    PhoneVerificationCodes
      .findOne({where: { user_id: userId, code: code }})
      .then((codeObj) => {
        if (!codeObj) {
          return reject('Phone number or code doesn\'t exist');
        } else {
          const createdDate = new Date(codeObj.created_at).valueOf();
          const dateNow = Date.now();
          var diff = (dateNow - createdDate) / 1000; //converting to seconds
          if (diff > 121) { // 2mins
            return reject('Please try creating new code, this code has been expired');
          }
          if (codeObj.code != code) {
            return reject('Please try again, this code didn\'t match with the code sent');
          }
          // all is well, we can proceed and remove the code
          PhoneVerificationCodes.destroy({ where: { user_id: userId}});
          return resolve(codeObj);
        }
      })
      .catch(() => {
        return reject('Something went wrong on our side');
      });
  });
  return promise;
}

/**
 * Generates a random number of 6 digits
 * @returns {number}
 */
function generateRandomCode() {
  return Math.floor(1000 + Math.random() * 900000).toString();
}

const service = {
  generateRandomCode, verifyCode, createPhoneCode
};


module.exports = service;
