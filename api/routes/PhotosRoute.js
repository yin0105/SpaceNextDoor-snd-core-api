const Joi = require('joi');
const PhotosController = require('../controllers/PhotosController');
const maxBytes = require('../../config/development.json').maxBytes;

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/orders/{order_id}/photos',
      options: {
        handler: PhotosController.uploadPhoto,
        payload: {
          maxBytes: maxBytes, //20MB max
          output: 'file',
          parse: true
        },
        validate: {
          query: {
            height: Joi.number(),
            width: Joi.number()
          },
          params: {
            order_id: Joi.number().required(),
          },
          payload: Joi.object({
            photo: Joi.object().required()
          }).unknown()
        },
        tags: ['api', 'photos'],
        description: 'Upload photo to S3 bucket and saves in db info regarding event',
        notes: 'Upload photo to s3 bucket'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/photos/{photo_id}',
      handler: PhotosController.editPhoto,
      options: {
        validate: {
          params: {
            order_id: Joi.number().required(),
            photo_id: Joi.number().required(),
          },
          payload: {
            is_visible: Joi.bool()
          }
        },
        tags: ['api', 'photos'],
        description: 'Edit photos visiblity given an event and a photo id of that event.',
        notes: 'Edit photos visibility'
      }
    },
    {
      method: 'GET',
      path: '/orders/{order_id}/photos/event',
      options: {
        auth: false,
        handler: PhotosController.getEventPhotos,
        validate: {
          query: {
            filter_visible: Joi.boolean(),
            polling: Joi.boolean().default(false),
            last_timestamp: Joi.date().optional()
          },
          params: {
            order_id: Joi.number().required(),
          }
        },
        tags: ['api', 'photos'],
        description: 'Gets public event photos for a specific order id',
        notes: 'Gets photos for a specific order id'
      }
    },
    {
      method: 'GET',
      path: '/orders/{order_id}/photos',
      options: {
        auth: {
          strategy: 'jwt',
          mode: 'optional'
        },
        handler: PhotosController.getPhotos,
        validate: {
          query: {
            limit: Joi.number().integer().default(0),         // default no limit
            page: Joi.number().integer().default(1),          // default first page 
            sort: Joi.boolean().default(false),               // sort by created datetime ASC (true) or DESC (false)
          },
          params: {
            order_id: Joi.alternatives([Joi.number(), Joi.string()]).required(),
          }
        },
        tags: ['api', 'photos'],
        description: 'Gets photos for a specific order id',
        notes: 'Gets photos for a specific order id'
      }
    }
  ]);
};
