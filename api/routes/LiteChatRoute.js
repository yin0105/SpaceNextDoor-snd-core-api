const Joi = require('joi');
const LiteChatController = require('../controllers/LiteChatController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/lite_chats/auth',
      handler: LiteChatController.chatAuth,
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
      method: 'POST',
      path: '/lite_chats',
      handler: LiteChatController.createChat,
      options: {
        validate: {
          payload: {
            user_id: Joi.number().required()
          }
        },
        tags: ['api', 'chat'],
        description: 'Creates a channel for specified provider, if exist it returns the channel',
        notes: 'Creates a channel for specified provider'
      }
    },
    {
      method: 'GET',
      path: '/lite_chats/unread_count',
      handler: LiteChatController.unreadCount,
      options: {
        tags: ['api', 'chat'],
        description: 'Returns the unread messages count for logged in user',
        notes: 'Returns the unread messages count for logged in user'
      }
    },
    {
      method: 'GET',
      path: '/lite_chats',
      handler: LiteChatController.getAll,
      options: {
        validate: {
          query: {
            not_archived: Joi.boolean().default(false),
            only_channels: Joi.boolean().default(false),
            include_labels: Joi.boolean().default(false)
          }
        },
        tags: ['api', 'chat'],
        description: 'Gets the channel for the users',
        notes: 'Gets the channels for the users chat room users'
      }
    },
    {
      method: 'GET',
      path: '/lite_chats/{channelId}',
      handler: LiteChatController.getDetails,
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
      path: '/lite_chats/{channelId}/messages',
      handler: LiteChatController.getChannelLiteMessages,
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
      path: '/lite_chats/{channelId}/messages/mark_read',
      handler: LiteChatController.markLiteMessagesRead,
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
      method: 'POST',
      path: '/lite_chats/pusher_webhook',
      handler: LiteChatController.webhookHandler,
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
