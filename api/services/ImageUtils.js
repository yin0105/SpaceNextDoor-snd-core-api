const gm = require('gm');

function getImageSize(stream) {
  return new Promise((resolve, reject) => {
    gm(stream)
    .size(function (err, size) {
      if (err) {
        return reject(err);
      }
      return resolve({width: size.width, height: size.height});
    });
  });
}

module.exports = {
  getImageSize
};