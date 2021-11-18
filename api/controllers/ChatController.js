'use strict';
const Boom = require('boom');
const Orders = require('../models/Orders');
const async = require('async');
const Users = require('../models/Users');
const promisify = require('../services/Helpers').promisify;
const Messages = require('../models/Messages');
const BookingStatuses = require('../models/BookingStatuses');
const sequelize = require('../../config/sequelize');
const pusher = require('../../config/pusher');
const controller = {};

controller.chatAuth = function (request, h) {
  const socketId = request.payload.socket_id;
  const channelName = request.payload.channel_name;
  const presenceData = {
    user_id: request.userId,
    user_info: request.userData
  };
  const token = pusher.authenticate(socketId, channelName, presenceData);
  return h.response(token);
};

controller.getAll = function (request, h) {
  const showNotComplete = request.query.not_completed;
  const findOrders = (statusIds) => {
    const filter = {
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId,
      messages_channel: sequelize.literal(`${Orders.getTableName()}.messages_channel IS NOT NULL`)
    };
    if (statusIds) {
      filter.status_id = {
        $and: statusIds.map(id => ({$ne: id}))
      };
    }
    return Orders.findAll({
      attributes: ['id', 'messages_channel'],
      include: [{
        model: Users,
        as: request.isProvider ? 'customer' : 'provider',
        attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
      }],
      where: filter,
      order: [ ['id', 'DESC']]
    })
    .then((chats) => {
      const tasks = chats.map((chat) => {
        return (cb) => {
          Messages.findOne({
            attributes: ['id', 'message', 'status', 'created'],
            where: {order_id: chat.id},
            order: [ ['id', 'DESC']],
            limit: 1,
          })
          .then((message) => {
            return cb(null, message ? message.get({plain:true}) : {});
          })
          .catch((err) => {
            console.log(err);
            return cb(err);
          });
        };
      });
      return promisify(async.parallel, tasks).then(messages => {
        chats = chats.map((chat, index) => {
          return Object.assign(chat.get({plain: true}), {last_message:  messages[index]});
        });
        return h.response(chats);
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  };

  if (showNotComplete) {
    return BookingStatuses.findAll({
      attributes: ['id'],
      where: {
        slug: {
          $or: ['cancelled', 'completed']
        }
      }
    })
    .then((statuses) => {
      return findOrders(statuses.map(s => s.id));
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  } else {
    return findOrders();
  }
};

controller.getAllChannels = function (request, h) {
  return BookingStatuses.findOne({
    where: {
      slug: 'cancelled'
    }
  })
  .then((status) => {
    return Orders.findAll({
      attributes: [
        'id',
        [request.isProvider ? 'customer_id' : 'provider_id', 'receiverId'],
        'messages_channel'],
      where: {
        [request.isProvider ? 'provider_id' : 'customer_id']: request.userId,
        status_id: {$ne: status.id}
      },
      order: [ ['id', 'DESC']]
    })
    .then((chats) => {
      return h.response(chats);
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.getDetails = function (request, h) {
  const channelId = request.params.channelId;
  return Orders.findOne({
    attributes: ['id', 'messages_channel'],
    include: [{
      model: Users,
      as: request.isProvider ? 'customer' : 'provider',
      attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
    }],
    where: {
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId,
      messages_channel: channelId
    }
  })
  .then((chat) => {
    if (!chat) {
      return Boom.notFound('Channel not found or user not authorized to join.');
    }
    return h.response(chat);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.webhookHandler = function (request, h) {
  const events = request.payload.events;
  const messages = [];
  events.forEach((eventData) => {
    const data = JSON.parse(eventData.data || "{}");
    if (eventData.event === 'client-send-new-message') {
      messages.push({
        order_id: data.orderId,
        channel: eventData.channel.replace('presence-', ''),
        message: data.message,
        random_message_identifier: data.id,
        receiver_id: data.receiver.id,
        sender_id: parseInt(eventData.user_id)
      });
    }
  });
  if (!messages.length) {
    return h.response('Success');
  }
  if (!messages[0].order_id) { // its for different webhook
    return h.response('Success');
  }
  console.log(messages);
  return Messages.bulkCreate(messages).then(() => {
    return h.response('Success');
  })
  .catch((err) => {
    console.log('******************Error occurred from pusher webhook***************');
    console.log(err);
    console.log('******************Error end****************************************');
    return Boom.internal(err);
  });
};

controller.markMessagesRead = function (request, h) {
  const {payload: {random_message_identifier}, params: {channelId}} = request;
  return Orders.findOne({
    attributes: ['id', 'customer_id', 'provider_id'],
    where: {
      messages_channel: channelId,
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
    }
  })
  .then((order) => {
    return Messages.update(
      {
        status: 1 // 1 means read, 0 means delivered (saved to db)
      },
      {
        where: {
          status: 0,
          order_id: order.id, // Logged in user is marking as read, so sender will be opposite
          sender_id: request.isProvider ? order.customer_id : order.provider_id,
          random_message_identifier: {
            // Mark all messages as read of current order which has identifier as less or eq
            // But only marks message as read of sender
            $lte: random_message_identifier
          },
        }
      }
    )
    .then((obj) => {
      return h.response({success: true, message: `Successfully marked ${obj[0]} messages as read`});
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.getChannelMessages = function (request, h) {
  let {page, limit} = request.query;
  const channel = request.params.channelId;
  const filterObj = {
    channel,
    $or: [
      {
        sender_id: request.userId
      },
      {
        receiver_id: request.userId
      }
    ]
  };

  return Messages.findAndCountAll({
    where: filterObj
  })
  .then((obj) => {
    let offset = 0;
    const totalRecords = obj.count; // e.g 13; limit 4 and page = 1
    const totalPages = Math.ceil(totalRecords/limit); // e.g 4
    if (page > totalPages) {
      return h.response([]);
    }
    if (page * limit > totalRecords) { // 4x4 = 16 > 13; true
      limit = limit - ((page * limit) % totalRecords); // 4 - (16mod13) = 4-3 = 1;
      offset = 0; // give me records from 1 to 1
    } else { // page = 3
      // 13 - (4x3)= 13-12= 1
      offset = totalRecords - (limit * page); // give me records from 2 to 2+limit: 6
    }
    return Messages.findAll({
      attributes: ['id', 'created', 'status', 'message', 'random_message_identifier'],
      include: [{
        model: Users,
        as: 'sender',
        attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
      },
      {
        model: Users,
        as: 'receiver',
        attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
      }],
      where: filterObj,
      offset, limit
    })
    .then((messages) => {
      return h.response(messages);
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
  
  
};

module.exports = controller;
