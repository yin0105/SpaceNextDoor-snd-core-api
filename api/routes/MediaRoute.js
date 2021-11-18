const Joi = require('joi');
const MediaController = require('../controllers/MediaController');
const maxBytes = require('../../config/development.json').maxBytes;

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/media/{type}/{entity_id}',
      options: {
        timeout: {
          server: 50000
        },
        handler: MediaController.uploadPhotos,
        payload: {
          maxBytes: maxBytes, //100MB max
          output: 'stream',
          parse: true
        },
        validate: {
          params: {
            entity_id: Joi.number(),
            type: Joi.string().valid(
              ['PORTFOLIO', 'GALLERY', 'USER_IMAGE', 'USER_COVER']
            ).required()
          },
          query: {
            resize: Joi.number().valid([1600, 1200, 600, 300]).default(1200)
          },
          payload: Joi.object({
            files: Joi.alternatives(Joi.object(), Joi.array().max(15)).required()
          }).unknown()
        },
        tags: ['api', 'media'],
        description: 'Uploads photos to S3 bucket and saves in db info regarding event: Can upload multiple images max 15 or single file',
        notes: 'Uploads photos to s3 bucket'
      }
    },
    {
      method: 'PUT',
      path: '/media/{type}/tags/{entity_id}',
      options: {
        auth: 'jwt',
        handler: MediaController.updatePhotos,
        validate: {
          params: {
            entity_id: Joi.number(),
            type: Joi.string().valid(['PORTFOLIO', 'GALLERY']).required()
          },
          payload: {
            camera_type: Joi.string().required(),
            tags: Joi.array().items(Joi.string()).required()
          }
        },
        tags: ['api', 'media'],
        description: 'Update photos tags, camera type which\'re belonging to user',
        notes: 'Update photos information'
      }
    },
    {
      method: 'DELETE',
      path: '/media/{type}/{entity_id}',
      options: {
        auth: 'jwt',
        handler: MediaController.deletePhotos,
        validate: {
          params: {
            entity_id: Joi.number(),
            type: Joi.string().valid(['PORTFOLIO', 'GALLERY']).required()
          }
        },
        tags: ['api', 'media'],
        description: 'Delete photos from S3 bucket and db',
        notes: 'Delete photos from S3 bucket and db'
      }
    },
    {
      method: 'DELETE',
      path: '/media/{type}/{entity_id}/{file_id}',
      options: {
        auth: 'jwt',
        handler: MediaController.deletePhotos,
        validate: {
          params: {
            entity_id: Joi.number(),
            file_id: Joi.number(),
            type: Joi.string().valid(['PORTFOLIO', 'GALLERY']).required()
          }
        },
        tags: ['api', 'media'],
        description: 'Delete photos from S3 bucket and db',
        notes: 'Delete photos from S3 bucket and db'
      }
    }
  ]);
};
