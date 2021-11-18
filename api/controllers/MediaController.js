'use strict';
const Boom = require('boom');
const mediaService = require('../services/MediaService');
const s3Service = require('../services/AmazonS3Service');
const ProviderPortfolioImages = require('../models/ProviderPortfolioImages');
const Orders = require('../models/Orders');
const BookingStatuses = require('../models/BookingStatuses');
const Photos = require('../models/Photos');
const controller = {};

controller.uploadPhotos = function (request, h) {
  const images = request.payload.files;
  const resize = request.query.resize;
  const entityId = request.params.entity_id;
  const type = request.params.type;
  const userId = request.userId;

  if (Array.isArray(images) && (type === 'USER_IMAGE' || type === 'USER_COVER')) {
    return Boom.badRequest('files should be an object');
  }

  if (!Array.isArray(images) && images.hapi && images.hapi.filename === 'blob') {
    images.hapi.filename = request.payload.qqfilename;
  }
  
  return mediaService.handleImages(images, resize, type, entityId, userId).then((result) => {
    if (type == 'GALLERY') {
      return updateOrderStatus(entityId).then(() => {
        return h.response({success: true, newUuid: result[0] && result[0].id, files: result});
      })
      .catch((e) => {
        // Since files uploaded successfully, doesn't makes sense to return error
        // instead fail silenlty
        console.log(e, 'error occured while updating the status of the orders');
        return h.response({success: true, newUuid: result[0] && result[0].id, files: result});
      });
    }
    return h.response({success: true, newUuid: result[0] && result[0].id, files: result});
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.updatePhotos = function (request, h) {
  const entityId = request.params.entity_id;
  const type = request.params.type;
  const userId = request.userId;
  const cameraType = request.payload.camera_type;
  const tags = request.payload.tags;

  const data = {
    camera_type: cameraType,
    tags: tags.join(',')
  };
  
  switch(type) {
    case 'PORTFOLIO':
      return updatePortfolioPhotos(h, userId, entityId, data);
    case 'GALLERY':
      return updateGalleryPhotos(h, userId, entityId, data);
    default:
      return Boom.badRequest('No type matched');  
  }
};

controller.deletePhotos = function (request, h) {
  if (!request.isProvider) return Boom.forbidden('You are not allowed to access');
  const type = request.params.type;
  const userId = request.userId;
  const id = request.params.entity_id;
  const fileId = request.params.file_id;
  let pathKey = '';
  let Model = {};
  let findObj = {};

  console.log(request.params);
  switch(type) {
    case 'PORTFOLIO':
      Model = ProviderPortfolioImages;
      findObj.id = id;
      findObj.user_id = userId;
      pathKey = 'link';
      break;
    case 'GALLERY':
      Model = Photos;
      findObj.order_id = id;
      findObj.id = fileId;
      pathKey = 'path';
      break;
    default:
      return Boom.badRequest('No type matched');  
  }

  return Model.findOne({where: findObj}).then(obj => {
    if (!obj) {
      return Boom.notFound('Resource not found or you have no access');
    }

    return Model.destroy({
      where: findObj,
      limit: 1
    })
    .then(() => {
      return s3Service.delete(obj[pathKey]).then(() => {
        return h.response({success:true});
      })
      .catch((err) => {
        console.log(err, 'Error deleting pics from s3', obj[pathKey]);
        return h.response({success:true});
      });
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

function updatePortfolioPhotos(h, userId, entityId, data) {
  return ProviderPortfolioImages.findOne({
    where: {
      id: entityId,
      user_id: userId
    }
  })
  .then((photo) => {
    if(!photo){
      return Boom.notFound('Media not found!');
    }
    return ProviderPortfolioImages.update(data,{ where: { id:entityId }})
    .then(() => {
      return h.response({error: false, message: 'Media updated successfully'});
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((er) => {
    return Boom.internal(er);
  });
}

function updateGalleryPhotos(h, userId, entityId, data) {
  return Photos.findOne({
    where: {
      id: entityId,
    }
  })
  .then((photo) => {
    if(!photo){
      return Boom.notFound('Media not found!');
    }
    // Check if it really belongs to logged in user
    return Orders.findOne({
      where: {
        id: photo.order_id,
        $or : {
          provider_id: userId,
          customer_id: userId
        }
      }
    }).then((order) => {
      if (!order) {
        return Boom.notFound('Media not found or not authorised to access!');
      }
      return Photos
        .update(data,{ where: { id: entityId }})
        .then(() => {
          return h.response({success: true, message: 'Media updated successfully'});
        })
        .catch((err) => {
          return Boom.internal(err);
        });
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
}


function updateOrderStatus(id) {
  return new Promise((resolve, reject) => {
    return BookingStatuses.findOne({
      attributes: ['id'],
      where: {
        slug: 'pending_approval'
      }
    }).then((status) => {
      return Orders.findOne({
        where: {
          id
        },
        include: [{model: BookingStatuses, as: 'status', attributes: ['id', 'slug']}]
      })
      .then((order) => {
        if (order.status.slug === 'pending_upload') {
          return Orders
            .update({status_id: status.id}, {where: {id}})
            .then(resolve)
            .catch(reject);
        } else {
          return resolve();
        }
      });
    })
    .catch(reject);
  });
}

module.exports = controller;
