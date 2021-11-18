'use strict';
const Photos = require('../models/Photos');
const Orders = require('../models/Orders');
const Events = require('../models/Events');
const Boom = require('boom');
const fs = require('fs');
const uiid = require('node-uuid');
const helpers = require('../services/Helpers');
const ImageUtils = require('../services/ImageUtils');
const waterMarker = require('../services/WaterMarkerService');
const uploadService = require('../services/AmazonS3Service');
const controller = {};

controller.getEventPhotos = function (request, h) {
  const filterVisible = request.query.filter_visible;
  const orderId = request.params.order_id;
  const isPolled = request.query.polling;
  const lastTimeStamp = request.query.last_timestamp;
  const filter = {
    where: {
      order_id: orderId
    },
    order: [ ['created_at', 'DESC']]
  };
  if (filterVisible) {
    filter.where.is_visible = true;
  }
  if (isPolled && lastTimeStamp) {
    filter.where.created_at = {
      $gt: new Date(lastTimeStamp)
    };
  }
  return Photos.findAll(filter).then(photos => {
    return Photos.findAll({
      attributes: ['id'],
      where: {
        order_id: orderId, is_visible: false
      },
    })
    .then((removedIds) => {
      return h.response({data: photos || [], not_visible: removedIds});
    });
  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });
};

controller.getPhotos = function (request, h) {
  const orderId = request.params.order_id;
  const userId = request.userId;
  const limit = request.query.limit;
  const page = request.query.page;
  const sort = request.query.sort;

  const order_filter = {
    where : {}
  };

  if (userId && helpers.isNumber(orderId)) { // Meaning user is logged in
    order_filter.where = {
      id: orderId,
      $and: {
        $or : {
          provider_id: userId,
          customer_id: userId
        }
      }
    };
  } else {
    order_filter.where.share_code = orderId;
  }

  //first check userId
  return Orders.findOne(order_filter).then(order => {
    
    if(!order){
      return Boom.notFound('Order not found!');
    }

    //then get all photo belonging to order
    const photo_filter = {
      where : {
        order_id: order.id
      }
    };

    if(limit > 0){
      photo_filter.limit = limit;
      let offset = (page-1)*limit;
      if(offset > 0){
        photo_filter.offset = offset;
      }
    }

    if(sort){
      photo_filter.order = [['created_at', 'ASC']];
    } else {
      photo_filter.order = [['created_at', 'DESC']];
    }

    return Photos.findAll(photo_filter).then(photos => {
      return h.response(photos);
    })
    .catch((err) => {
      console.log(err);
      return Boom.internal(err);
    });

  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });
  
};

controller.uploadPhoto = function (request, h) {
  let imageDimensions = {};
  const photo = request.payload.photo;
  const orderId = request.params.order_id;
  const userId = request.providerId;
  const photoName = photo.filename == 'blob' ? request.payload.qqfilename : photo.filename;
  const key = `orders/${orderId}/compressed/${uiid.v1()}.jpg`;

  if (!userId) {
    return Boom.unauthorized();
  }

  const createPhotoRecord = (err, data) => {
    if (err) {
      console.log(err);
      return Boom.internal(err);
    }
    return Photos.create({
      name: photoName, order_id: orderId, path: `/${key}`, 
      width: imageDimensions.width, height: imageDimensions.height
    })
    .then((photo) => {
      const jsonObj = photo.toJSON();
      return h.response(Object.assign({success: true, newUuid: jsonObj.id}, jsonObj));
    })
    .catch((err) => {
      console.log(err, 'errror creating photo record in db');
      return Boom.internal(err);
    });
  };

  return ImageUtils.getImageSize(fs.createReadStream(photo.path)).then((dimensions) => {
    imageDimensions = dimensions;
    console.log(dimensions);
    return Orders.findOne({
      attributes: ['id', 'event_id'],
      include: [{model: Events, as: 'event'}],
      where: {
        provider_id: userId,
        id: orderId,
      }
    })
    .then((order) => {
      if (!order) {
        return Boom.notFound('Order not found!');
      }
      if (!order.event) {
        return Boom.notFound('Event not associated!');
      }
      const event = order.event;
      // If there is watermark, Use it, otherwise don't water mark the image 
      // and proceed with upload
      if (event.water_marker_logo) {
        return waterMarker
          .watermarkWithOverlay(
            event.water_marker_logo,
            fs.createReadStream(photo.path),
            event.water_marker_position,
            event.overlay_image || null
          )
          .then((stream) => {
            return stream.pipe(uploadService.uploadFromStream(key, photo['content-type'], createPhotoRecord));
          })
          .catch((er) => {
            console.log(er);
            return Boom.internal(er);
          });
      } else {
        return uploadService.upload(photo.path, key, photo['content-type'], createPhotoRecord);
      }
    })
    .catch((err) => {
      console.log(err);
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });
};

controller.editPhoto = function (request, h) {
  const photoId = request.params.photo_id;
  const eventId = request.params.order_id;
  const payload = request.payload;
  return Photos.findOne({
    where: {
      order_id: eventId,
      id: photoId
    }
  })
  .then((photo) => {
    if (!photo) {
      return Boom.notFound('Photo not found!');
    }
    return Photos.update(payload, {where: { order_id: eventId, id: photoId }})
    .then(() => {
      return h.response({error: false, message: 'Photo updated successfully'});
    })
    .catch((er) => {
      return Boom.internal(er);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

module.exports = controller;
