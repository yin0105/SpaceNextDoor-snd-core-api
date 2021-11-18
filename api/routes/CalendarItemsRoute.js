const Joi = require('joi');
const CalendarItemsController = require('../controllers/CalendarItemsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/calendar_items',
      handler: CalendarItemsController.createItem,
      options: {
        auth: 'jwt',
        validate: {
          payload: {
            type: Joi.string().valid(['NOT_AVAILABLE']),
            start: Joi.date().required(),
            end: Joi.date().required()
          }
        },
        tags: ['api', 'calendar items'],
        description: 'Adds calendar items to the provider calendar',
        notes: 'Adds calendar items to the calendar'
      }
    },
    {
      method: 'PUT',
      path: '/calendar_items/{id}',
      handler: CalendarItemsController.editItem,
      options: {
        auth: 'jwt',
        validate: {
          payload: {
            start: Joi.date(),
            end: Joi.date()
          }
        },
        tags: ['api', 'calendar items'],
        description: 'Edits a calendar item in providers calendar',
        notes: 'Edits a calendar item in providers calendar'
      }
    },
    {
      method: 'GET',
      path: '/calendar_items',
      handler: CalendarItemsController.getAll,
      options: {
        auth: 'jwt',
        validate: {
          query: {
            after: Joi.string(),
            user_id: Joi.number()
          }
        },
        tags: ['api', 'calendar items'],
        description: 'Gets the calendar items for provider',
        notes: 'Gets the calendar items for provider'
      }
    },
    {
      method: 'DELETE',
      path: '/calendar_items/{id}',
      handler: CalendarItemsController.deleteItem,
      options: {
        auth: 'jwt',
        tags: ['api', 'calendar items'],
        description: 'Deletes a calendar item from provider schedule/calendar',
        notes: 'Deletes a calendar item from provider schedule/calendar'
      }
    },
  ]);
};
