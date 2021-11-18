const Joi = require('joi');
const Controller = require('../controllers/ProvidersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/providers',
      options: {
        auth: {
          strategy: 'jwt',
          mode: 'optional' // Optional, used with restricted data access
        },
        handler: Controller.getProviders,
        validate: {
          query: {
            sort_by: Joi.string().valid(['price', 'rating']).default('rating'),
            sort_order: Joi.string().valid(['desc', 'asc']).default('desc'),
            specialty: Joi.array().items(Joi.string()).default([]).optional(),
            location: Joi.array().items(Joi.string()).default([]).optional(),
            b2b: Joi.bool().default(false),
            min_price: Joi.number(),
            max_price: Joi.number().optional(),
            min_rating: Joi.number(),
            max_rating: Joi.number().optional(),
            search: Joi.string().optional(),
            page: Joi.number().default(0),
            limit: Joi.number().default(16),
          }
        },
        tags: ['api', 'providers'],
        description: 'Get providers based on query params',
        notes: 'Get providers (photographers) based on the query'
      }
    },
    {
      method: 'GET',
      path: '/providers/{provider_id}',
      options: {
        auth: {
          strategy: 'jwt',
          mode: 'optional' // Optional, used with restricted data access
        },
        handler: Controller.getOneProvider,
        validate: {
          query: {
            include_addons: Joi.bool().default(false),
            include_specialties: Joi.bool().default(false),
            include_related_results: Joi.bool().default(false)
          },
          params: {
            provider_id: Joi.alternatives(Joi.number(), Joi.string()).required(),
          }
        },
        tags: ['api', 'providers'],
        description: 'Gets provider for a specific provider id. If the id is `me`, then' +
        ' data private to currently logged in provider is returned.',
        notes: 'Gets provider for a specific provider id'
      }
    },
    {
      method: 'GET',
      path: '/providers/{provider_id}/portfolio',
      options: {
        auth: {
          strategy: 'jwt',
          mode: 'optional' // Optional, used with restricted data access
        },
        handler: Controller.getProviderPortfolio,
        validate: {
          query: {
            limit: Joi.number().default(10),
            page: Joi.number().default(1)
          },
          params: {
            provider_id: Joi.alternatives(Joi.number(), Joi.string()).required(),
          }
        },
        tags: ['api', 'providers'],
        description: 'Gets portfolio of a provider, requires no auth',
        notes: 'Gets portfolio of a provider, requires no auth'
      }
    },
    {
      method: 'PUT',
      path: '/providers',
      options: {
        auth: 'jwt',
        handler: Controller.updateProviderInfo,
        validate: {
          payload: {
            first_name: Joi.string(),
            last_name: Joi.string(),
            username: Joi.string().regex(/^[a-z0-9]+$/),    
            locations: Joi.array().items({
              id: Joi.number(),
              location: Joi.string().required(),
              country: Joi.string(),
              lat: Joi.number(),
              long: Joi.number()
            }),
            provider: {
              profile_completed: Joi.bool().valid([true]),
              title: Joi.string(),
              about: Joi.string(),
              note: Joi.string(),
              hourly_rate: Joi.number(),
              per_day_rate: Joi.number(),
              extra_edit_cost: Joi.number(),
              edits_per_hour: Joi.number(),
              min_hours_for_booking: Joi.number(),
              raw_photos_per_hour: Joi.number(),
              max_group_size: Joi.number(),
              specialty: Joi.array().items(Joi.number()),
              delivery_time: Joi.number(),
              camera_type: Joi.array().items(Joi.number()),
              languages: Joi.array().items(Joi.number()), 
              cancellation_policy_id : Joi.number(),
              website_link: Joi.string(),
              social_media_links: Joi.object(),
              payout_data: Joi.string(),
              addons: Joi.array().items({
                id: Joi.number(),
                title: Joi.string(),
                addon_price: Joi.number()
              })
            }
          }
        },
        tags: ['api', 'providers'],
        description: 'Updates provider info of currently logged in provider. There are few' +
        ' things that should be kept in mind while sending the payload. If consumer sends' +
        ' no locations or addons, then it\'ll not change anything in the db. But if it' +
        ' sends locations there are few cases. Case 1 - Creation: If you don\'t add the id in object' +
        ' the API will create the object. Case 2 - Deletion: If you don\'t send any object'+
        ' in payload API will delete that object. Case 3 - Updation (Addons only): If you ' +
        ' want to update the addons, send the response with id and changed object. The API' +
        ' will find that object by that id and update it. Note - Locations only: The API ' +
        ' first checks that if that specific location exist in the table, if not it\'ll create' +
        ' the location and then save it in the other table. So there is no updation in this' +
        ' case. If you want to update, delete it and create new one.',
        notes: 'Updates provider info of currently logged in provider'
      }
    },
    {
      method: 'GET',
      path: '/providers/me/connect/instagram',
      options: {
        auth: 'instagram',
        handler: Controller.connectSocialMedia,
        tags: ['api', 'providers'],
        description: 'You need to pass jwt token of logged in provider as query param ' +
        'it will redirect the user after successfull connection of instagram account ' +
        'to /s/connect-redirect?success={message} and if error its gonna redirect to ' +
        '/s/connect-redirect?error={message}',
        notes: 'Endpoint to connect instagram account with providers account'
      }
    },
    {
      method: 'GET',
      path: '/providers/me/connect/facebook',
      options: {
        auth: 'facebook',
        handler: Controller.connectSocialMedia,
        tags: ['api', 'providers'],
        description: 'You need to pass jwt token of logged in provider as query param ' +
        'it will redirect the user after successfull connection of facebook account ' +
        'to /s/connect-redirect?success={message} and if error its gonna redirect to ' +
        '/s/connect-redirect?error={message}',
        notes: 'Endpoint to connect facebook account with providers account'
      }
    },
  ]);
};
