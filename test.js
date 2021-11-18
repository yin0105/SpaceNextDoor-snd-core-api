var bcrypt = require('bcrypt');
bcrypt.genSalt(10, function (err, salt) {
bcrypt.hash('hamzabaig', salt, function (err, hash) {
        if (err) return reject(err);
        // if all is ok then return hash password
  console.log(hash);
      });
});
