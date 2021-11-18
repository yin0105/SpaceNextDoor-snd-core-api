const jwtConfig = require('../../config/jwt.json');
const Users = require('../models/Users');
const to = require('await-to-js').to;

module.exports = function (server) {

  server.auth.strategy('jwt', 'jwt', {
    key: jwtConfig.secret,
    verifyOptions: {
      algorithms: ['HS256'],
      tokenType: 'Bearer'
    },
    validate: async (decoded, request, callback) => {
      const [err, User] = await to(Users.findOne({
        attributes: [
          'id', 'username', 'image', 'first_name', 'role', 'email',
          'last_name', 'provider_id', 'customer_id', 'is_admin'
        ],
        where: {
          id: decoded.userId
        }
      }));

      if (err || !User) {
        return {credentials: null, isValid: false};
      }

      const credentials = {
        isAuth: true,
        role: User.role,
        isProvider: !!User.provider_id,
        isCustomer: !!User.customer_id,
        userId: User.id,
        email: User.email,
        name: User.first_name + ' ' + User.last_name,
        providerId: User.provider_id,
        customerId: User.customer_id,
        isAdmin: !!User.is_admin,
        userData: {
          image: User.image,
          username: User.username,
          first_name: User.first_name,
          last_name: User.last_name
        }
      }
      request = Object.assign(request, credentials);

      return {isValid: true, credentials};
    }
  });
  server.auth.default('jwt');
};
