'use strict';
const Boom = require('boom');
const async = require('async');
const Users = require('../models/Users');
const Orders = require('../models/Orders');
const promisify = require('../services/Helpers').promisify;
const BookingStatuses = require('../models/BookingStatuses');
const moment = require('moment');
const LiteMessages = require('../models/LiteMessages');
const MessagesChannels = require('../models/MessagesChannels');
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

controller.createChat = function (request, h) {
  const providerId = request.isProvider ? request.userId : request.payload.user_id;
  const customerId = !request.isProvider ? request.userId : request.payload.user_id;

  return MessagesChannels.findOne({
    where: {
      provider_id: providerId,
      customer_id: customerId
    }
  })
  .then((chat) => {
    if (chat) {
      return h.response({success: true, data: chat});
    } else {
      return MessagesChannels
        .create({provider_id: providerId, customer_id: customerId})
        .then((channel) => {
          pusher.trigger('provider-notification-' + (request.isProvider ? customerId : providerId), 'NEW_CHANNEL', channel);
          return h.response({success: true, data: channel});
        })
        .catch((e) => {
          return Boom.internal(e);
        });
    }
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.unreadCount = function (request, h) {
  const userId = request.userId;
  return LiteMessages.findAndCount({
    where: {
      receiver_id: userId,
      status: 0
    }
  })
  .then((res) => {
    return h.response({unread_messages: res.count});
  })
  .catch(e => {
    return Boom.internal(e);
  });
};

controller.getAll = function (request, h) {
  const filterArchived = request.query.not_archived;
  const onlyChannels = request.query.only_channels;
  const includeLabels = request.query.include_labels;

  const filter = {
    [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
  };
  let attributes = ['id', 'channel'];
  const include = [];

  if (filterArchived) {
    filter.archived = false; // don't include archived
  }

  if (!onlyChannels) {
    attributes = attributes.concat(['customer_id', 'provider_id']);
    include.push({
      model: Users,
      as: request.isProvider ? 'customer' : 'provider',
      attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
    });
  } else {
    attributes.push(request.isProvider ? 'customer_id' : 'provider_id');
  }

  const findMessageChannels = (statusIds) => {
    return MessagesChannels.findAll({
      attributes: attributes,
      include: include,
      where: filter,
      order: [ ['id', 'DESC']]
    })
    .then((chats) => {
      if (onlyChannels) {
        return h.response(chats);
      }
      const tasks = chats.map((chat) => {
        return (cb) => {
          const subTasks = [];

          subTasks.push((callback) => {
            LiteMessages.findOne({
              attributes: ['id', 'message', 'status', 'created', 'receiver_id', 'sender_id'],
              where: {channel: chat.channel},
              order: [ ['id', 'DESC']],
              limit: 1,
            })
            .then((message) => {
              return callback(null, message ? message.get({plain:true}) : {});
            })
            .catch((err) => {
              return callback(err);
            });
          });

          if (includeLabels) {
            subTasks.push((callback) => {
              Orders.findOne({
                attributes: ['id', 'booking_date'],
                where: {
                  provider_id: chat.provider_id,
                  customer_id: chat.customer_id,
                  status_id: {
                    $and: statusIds.map(id => ({$ne: id}))
                  },
                  booking_date: {
                    $gte: moment().format('YYYY-MM-DD')
                  }
                },
                include: [{model: BookingStatuses, as: 'status', attributes: ['name']}],
                order: [['booking_date', 'ASC']]
              })
              .then(order => {
                const obj = order ? order.get({plain:true}) : {};
                if (obj.status) {
                  obj.status = obj.status.name;
                }
                return callback(null, obj);
              })
              .catch((err) => {
                return callback(err);
              });
            });
          }

          return promisify(async.parallel, subTasks).then(result => {
            return cb(null, {last_message: result[0], label: result[1]});
          })
          .catch(err => {
            return cb(err, {});
          });
        };
      });

      return promisify(async.parallel, tasks).then(messages => {
        chats = chats.map((chat, index) => {
          return Object.assign(chat.get({plain: true}), messages[index]);
        });
        return h.response(chats);
      })
      .catch(err => {
        return Boom.internal(err);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  };

  if (includeLabels) {
    return BookingStatuses.findAll({
      attributes: ['id'],
      where: {
        slug: {
          $or: ['cancelled', 'completed']
        }
      }
    })
    .then(statuses => {
      return findMessageChannels(statuses.map(st => st.id));
    })
    .catch(er => {
      return Boom.internal(er);
    });
  } else {
    return findMessageChannels();
  }
};

controller.getDetails = function (request, h) {
  const channelId = request.params.channelId;
  return MessagesChannels.findOne({
    attributes: ['id', 'channel'],
    include: [{
      model: Users,
      as: request.isProvider ? 'customer' : 'provider',
      attributes: ['id', 'username', 'first_name', 'last_name', 'image', ]
    }],
    where: {
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId,
      channel: channelId
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
  return LiteMessages.bulkCreate(messages).then(() => {
    return h.response('Success');
  })
  .catch((err) => {
    console.log('******************Error occurred from pusher webhook***************');
    console.log(err);
    console.log('******************Error end****************************************');
    return Boom.internal(err);
  });
};

controller.markLiteMessagesRead = function (request, h) {
  const {payload: {random_message_identifier}, params: {channelId}} = request;
  return MessagesChannels.findOne({
    attributes: ['id', 'customer_id', 'provider_id'],
    where: {
      channel: channelId,
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
    }
  })
  .then((chat) => {
    return LiteMessages.update(
      {
        status: 1 // 1 means read, 0 means delivered (saved to db)
      },
      {
        where: {
          status: 0,
          sender_id: request.isProvider ? chat.customer_id : chat.provider_id,
          random_message_identifier: {
            // Mark all LiteMessages as read of current order which has identifier as less or eq
            // But only marks message as read of sender
            $lte: random_message_identifier
          },
        }
      }
    )
    .then((obj) => {
      return h.response({success: true, message: `Successfully marked ${obj[0]} LiteMessages as read`});
    })
    .catch((err) => {
      return Boom.internal(err);
    });
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.getChannelLiteMessages = function (request, h) {
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

  return LiteMessages.findAndCountAll({
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
    return LiteMessages.findAll({
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
