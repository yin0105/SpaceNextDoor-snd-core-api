const Joi = require('joi');
const OrdersController = require('../controllers/OrdersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/orders',
      handler: OrdersController.createOrder,
      options: {
        validate: {
          payload: {
            provider_id: Joi.number().required(),
            booking_date: Joi.string().required(),
            booking_purpose: Joi.string().required(),
            start_time: Joi.string().required(),
            customer_phone: Joi.string().required(),
            location_id: Joi.number().required(),
            specialty: Joi.string().required(),
            photography_style: Joi.string().required(),
            no_of_hours: Joi.number().required(),
            nature_of_shoot: Joi.string(),
            shoot_vision: Joi.string(),
            meeting_venue: Joi.string().required(),
            group_size: Joi.number().required(),
            addons: Joi.string().regex(/^[0-9,]+$/).optional(),
            wandersnap_consent: Joi.bool().default(false),
            coupon_code: Joi.string().optional(),
            customer_id: Joi.number().optional(),
            discount_amount: Joi.number().optional(),
            provider_hourly_rate: Joi.number().optional()
          },
        },
        tags: ['api', 'orders'],
        description: 'Creates an order for the logged in customer. `addons` must be a ' +
        'comma separated ids of the addons in the providers addons',
        notes: '[CUSTOMER ONLY] Create order for logged in customer'
      }
    },
    {
      method: 'GET',
      path: '/orders/{order_id}',
      handler: OrdersController.getOne,
      options: {
        auth: {
          strategy: 'jwt',
          mode: 'optional' // Optional, used with restricted data access
        },
        validate: {
          params: {
            order_id: Joi.alternatives([Joi.string(), Joi.number()]).required(),
          },
        },
        tags: ['api', 'orders'],
        description: 'Get specific booking for given order id',
        notes: 'Get specific booking by id'
      }
    },
    {
      method: 'GET',
      path: '/orders/{order_id}/event',
      handler: OrdersController.getOrderEvent,
      options: {
        auth: false,
        validate: {
          params: {
            order_id: Joi.number().required(),
          },
        },
        tags: ['api', 'orders'],
        description: 'Get specific booking event for given order id',
        notes: 'Get specific booking event by id'
      }
    },
    {
      method: 'GET',
      path: '/orders/{order_id}/download',
      handler: OrdersController.downloadOrderPictures,
      options: {
        auth: false,
        validate: {
          params: {
            order_id: Joi.alternatives([Joi.string(), Joi.number()]).required()
          },
          query: {
            auth: Joi.string()
          }
        },
        tags: ['api', 'orders'],
        description: 'Zips event pictures and starts downloading',
        notes: 'Zips event pictures and starts downloading'
      }
    },
    {
      method: 'GET',
      path: '/orders',
      options: {
        handler: OrdersController.getAll,
        tags: ['api', 'orders'],
        description: 'Get all bookings of a given customer or provider',
        notes: 'Gets all orders of a customer or provider'
      }
    },
    {
      method: 'GET',
      path: '/orders/events',
      options: {
        handler: OrdersController.getEvents,
        tags: ['api', 'orders'],
        description: 'Get all bookings of a given customer or provider',
        notes: 'Gets all orders of a customer or provider'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}',
      handler: OrdersController.updateOrder,
      options: {
        validate: {
          params: {
            order_id: Joi.number().required(),
          },
          payload: {
            group_size: Joi.number(),
            booking_purpose: Joi.string(),
            photography_style: Joi.string(),
            specialty: Joi.string(),
            customer_phone: Joi.string(),
            meeting_venue: Joi.string(),
            nature_of_shoot: Joi.string(),
            wandersnap_consent: Joi.boolean(),
            start_time: Joi.string(),
            booking_date: Joi.string()
          }
        },
        tags: ['api', 'orders'],
        description: 'Update specific booking for given order id',
        notes: 'Update specific booking by id'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/cancel',
      handler: OrdersController.cancelOrder,
      options: {
        validate: {
          params: {
            order_id: Joi.number().required(),
          },
          payload: {
            reason: Joi.string()
          }
        },
        tags: ['api', 'orders'],
        description: 'Cancels the order and saves the reason',
        notes: 'Cancels order and changes booking status'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/share_gallery',
      handler: OrdersController.createShareGalleryLink,
      options: {
        validate: {
          params: {
            order_id: Joi.number().required(),
          }
        },
        tags: ['api', 'orders'],
        description: 'Creates the gallery shareable link and return it',
        notes: 'Creates the gallery shareable link and return it'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/approve_gallery',
      handler: OrdersController.approveOrderGallery,
      options: {
        validate: {
          params: {
            order_id: Joi.number().required(),
          }
        },
        tags: ['api', 'orders'],
        description: 'Approves the gallery which is in pending_approval state',
        notes: 'Approves the gallery which is in pending_approval state'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/payments',
      handler: OrdersController.payOrder,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          },
          payload: {
            stripe_token: Joi.string().required(),                                                    // Stripe card token or 'admin' for admin payment
            customer_id: Joi.number().when('stripe_token', { is: 'admin', then: Joi.required() }),    // for admin payment
            account_id: Joi.string().when('stripe_token', { is: 'admin', then: Joi.required() }),     // Xero account ID
            payment_method: Joi.string().when('stripe_token', { is: 'admin', then: Joi.required() }), // Reference Payment Method
            transaction_id: Joi.string().when('stripe_token', { is: 'admin', then: Joi.required() })  // Reference Transaction ID
          }
        },
        tags: ['api', 'orders'],
        description: 'Record order payment by accepting Stripe card token pay to platform ',
        notes: 'Customer make an order payment'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/refunds',
      handler: OrdersController.refundOrder,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          },
          payload: {
            amount: Joi.number().greater(0).required()  //refund amount
          }
        },
        tags: ['api', 'orders'],
        description: 'Refunds booking via Stripe by accepting refund amount and does ledger',
        notes: 'Admin or Provider make an order refund'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/cover',
      handler: OrdersController.setCoverPhoto,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          },
          payload: {
            file_id: Joi.number().required()  //Stripe card token
          }
        },
        tags: ['api', 'orders'],
        description: 'Updates the cover photo of gallery in order info',
        notes: 'Updates the cover photo of gallery'
      }
    },
    {
      method: 'POST',
      path: '/orders/{order_id}/reviews',
      handler: OrdersController.createReview,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          },
          payload: {
            review: Joi.string().required(),
            rating: Joi.number().min(1).max(5).required()
          }
        },
        tags: ['api', 'orders'],
        description: 'Creates review for provider or customer by customer or provider ' +
        'If logged in user is customer then customer is giving review to provider and vice versa. ' +
        ' No need to pass any ids as api automatically takes it from order info ;) ' + 
        'The order status must be pending review otherwise its gonna throw an error and ' +
        'one role can give review only once. Meaning if provider already gave a review ' + 
        'it can not give review again to same order and vice versa.',
        notes: 'Creates a review for provider or customer'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/vacate',
      handler: OrdersController.vacateOrder,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          }
        },
        tags: ['api', 'orders'],
        description: 'Vacates the booking, by update booking\'s provider to be Wandersnap crew',
        notes: 'Vacates the booking'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{order_id}/accept',
      handler: OrdersController.acceptOrder,
      options: {
        auth: 'jwt',
        validate: {
          params: {
            order_id: Joi.number().required()
          }
        },
        tags: ['api', 'orders'],
        description: 'Updates the booking\'s provider to whom apply the recruit mail first',
        notes: 'Updates the booking\'s provider'
      }
    }
  ]);
};
