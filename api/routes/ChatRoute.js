const Joi = require('joi');
const ChatController = require('../controllers/ChatController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/chats/auth',
      handler: ChatController.chatAuth,
      options: {
        validate: {
          payload: {
            channel_name: Joi.string(),
            socket_id: Joi.string()
          }
        },
        tags: ['api', 'chat'],
        description: 'Authenticates the chat room users',
        notes: 'Authenticates chat room users'
      }
    },
    {
      method: 'GET',
      path: '/chats',
      handler: ChatController.getAll,
      options: {
        validate: {
          query: {
            not_completed: Joi.boolean(),
          }
        },
        tags: ['api', 'chat'],
        description: 'Gets the channel for the users',
        notes: 'Gets the channels for the users chat room users'
      }
    },
    {
      method: 'GET',
      path: '/chats/{channelId}',
      handler: ChatController.getDetails,
      options: {
        validate: {
          params: {
            channelId: Joi.string().required(),
          }
        },
        tags: ['api', 'chat'],
        description: 'Gets the chat info for a specific channel',
        notes: 'Gets the chat info for a specific channel'
      }
    },
    {
      method: 'GET',
      path: '/chats/{channelId}/messages',
      handler: ChatController.getChannelMessages,
      options: {
        validate: {
          query: {
            page: Joi.number().default(1),
            limit: Joi.number().max(30).min(5).default(20)
          }
        },
        tags: ['api', 'chat'],
        description: 'Gets the chat info for a specific channel',
        notes: 'Gets the chat info for a specific channel'
      }
    },
    {
      method: 'PUT',
      path: '/chats/{channelId}/messages/mark_read',
      handler: ChatController.markMessagesRead,
      options: {
        validate: {
          payload: {
            random_message_identifier: Joi.number().required(),
          }
        },
        tags: ['api', 'chat'],
        description: 'Marks the messages in chat as read for given channel',
        notes: 'Marks the messages in chat as read for given channel'
      }
    },
    {
      method: 'GET',
      path: '/chats/channels',
      handler: ChatController.getAllChannels,
      options: {
        tags: ['api', 'chat'],
        description: 'Gets the channel list that user can subscribe',
        notes: 'Gets the channel list that user can subscribe'
      }
    },
    {
      method: 'POST',
      path: '/chats/pusher_webhook',
      handler: ChatController.webhookHandler,
      options: {
        auth: false,
        validate: {
          payload: Joi.object()
        },
        tags: ['api', 'chat'],
        description: 'Whenever a message is sent on client side, this endpoint is called and creates message in db',
        notes: 'Creates message and saves in db'
      }
    },
  ]);
};
