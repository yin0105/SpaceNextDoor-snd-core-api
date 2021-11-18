const S3Service = require('./AmazonS3Service');
const gm = require('gm');
const async = require('async');
const uiid = require('node-uuid');
// Models
const ProviderPortfolioImages = require('../models/ProviderPortfolioImages');
const Photos = require('../models/Photos');
const Users = require('../models/Users');

const service = {
  handleImages
};

function handleImages(images, resizeOption, type, entityId, userId) {
  let tasks = [];
  if (Array.isArray(images)) {
    tasks = images.map((file) => {
      return getTask(file, resizeOption, type, entityId, userId);
    });
  } else {
    tasks = [getTask(images, resizeOption, type, entityId, userId)];
  }
  return new Promise((resolve, reject) => {
    async.parallel(tasks, (err, result) => {
      if (err) {
        return reject(err);
      }
      switch(type) {
        case 'PORTFOLIO':
          return ProviderPortfolioImages.bulkCreate(
            result.map(({width, height, key}) => ({
              link: `/${key}`,
              width, height,
              resized_value: resizeOption,
              user_id: userId
            }))
          ).then((portfolioRes) => {
            return resolve(portfolioRes);
          })
          .catch(reject);
        case 'GALLERY':
          return Photos.bulkCreate(
            result.map(({width, height, key, name}) => ({
              path: `/${key}`,
              width, height, name,
              order_id: entityId
            }))
          ).then((galleryRes) => {
            return resolve(galleryRes);
          })
          .catch(reject);
        case 'USER_IMAGE':
        case 'USER_COVER':
          return Users.update({
            [type == 'USER_COVER' ? 'cover' : 'image']: `/${result[0].key}`
          }, {where: {id: userId}}).then(() => {
            return resolve(`/${result[0].key}`);
          })
          .catch(reject);
        default:
          return reject('No type matched');
      }
    });
  });
}

function getTask(file, resizeOption, type, entityId, userId) {
  const uuid = uiid.v1();
  return (cb) => {
    async.parallel([
      // Original, optimised
      (callback) => {
        const key = getKey(uuid, null, type, entityId, userId);
        
        S3Service.uploadViaParts(
          key,
          gm(file)
            .autoOrient()
            .resize(2000, null)
            .strip()
            .setFormat('jpg')
            .stream(), 
          file.hapi['content-type']
          , (err) => {
            callback(err, key); // Passing the key to retrieve it later in callback
          }
        );
      },
      // Resized image
      (callback) => {
        const key = getKey(uuid, resizeOption, type, entityId, userId);
        let width, height;
        S3Service.uploadViaParts(
          key,
          gm(file)
            .autoOrient()
            .size(function (err, size) {
              if (!err) {
                width = size.width;
                height = size.height;
              }
            })
            .resize(resizeOption, null)
            .strip()
            .setFormat('jpg')
            .stream(), 
          file.hapi['content-type']
          , (err) => {
            callback(err, {height, width, key, name: file.hapi.filename}); // Passing the key to retrieve it later in callback
          }
        );
      }
    ], (err, result) => {
      cb(err, result && result[1]);
    });
  };
}

function getKey(uuid, resize, type, entityId, userId) {
  switch(type) {
    case 'PORTFOLIO':
      return `portfolio/${userId}/${resize ? resize + '_' : ''}${uuid}.jpg`;
    case 'GALLERY':
      return `orders/${entityId}/compressed/${resize ? resize + '/' : ''}${uuid}.jpg`;
    case 'USER_IMAGE':
      return `profile/${userId}/image/${resize ? resize + '_' : ''}${uuid}.jpg`;
    case 'USER_COVER':
      return `profile/${userId}/cover/${resize ? resize + '_' : ''}${uuid}.jpg`;
    default: 
      return ''; //Not possible
  }
}

module.exports = service;