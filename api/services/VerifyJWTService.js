const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt.json');
const Users = require('../models/Users');

function verify (token) {
  const promise = new Promise((resolve, reject) => {
    jwt.verify(token, jwtConfig.secret, {
      algorithms: ['HS256'],
      tokenType: 'Bearer'
    }, (err, decoded) => {
      if (err) return reject(err);
      Users
        .findOne({
          attributes: [
            'id', 'username', 'image', 'first_name', 'role',
            'last_name', 'provider_id', 'customer_id', 'is_admin'
          ],
          where: {
            id: decoded.userId
          }
        })
        .then((User) => {
          if (!User) {
            return reject();
          } else {
            const obj = {
              isAuth: true, 
              role: User.role,
              isProvider: !!User.provider_id,
              isCustomer: !!User.customer_id,
              userId: User.id,
              providerId: User.provider_id,
              customerId: User.customer_id,
              isAdmin: !!User.is_admin
            };
            return resolve(obj);
          }
        })
        .catch(reject);
    });
  });

  return promise;
}

module.exports = {
  verify
};