module.exports = {
  isNumber: (str = '') => !(/[a-z]/i.test(str + '')),
  promisify: (func, arg) => {
    return new Promise((resolve, reject) => {
      func(arg, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      })
    });
  }
};