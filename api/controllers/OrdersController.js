'use strict';
const Boom = require('boom');
const async = require('async');
const sequelize = require('../../config/sequelize');
const Orders = require('../models/Orders');
const Providers = require('../models/Providers');
const ProviderAddOns = require('../models/ProviderAddOns');
const Photos = require('../models/Photos');
const slug = require('slug');
const VerifyJWTService = require('../services/VerifyJWTService');
const S3ZipperService = require('../services/S3ZipperService');
const Reviews = require('../models/Reviews');
const Users = require('../models/Users');
const Events = require('../models/Events');
const Coupons = require('../models/Coupons');
const CouponUses = require('../models/CouponUses');
const Locations = require('../models/Locations');
const BookingStatuses = require('../models/BookingStatuses');
const ExchangeRates = require('../models/ExchangeRate');
const orderActions = require('../actions/order.actions');
const LedgerService = require('../services/LedgerService');
const StripeService = require('../services/StripeService');
const emailService = require('../services/EmailService');
const helpers = require('../services/Helpers');
const XeroService = require('../services/XeroService');
const promisify = helpers.promisify;
const shortid = require('shortid');
const config = require('../../config');
const controller = {};

controller.createOrder = async (request, h) => {
  // allow customer and admin
  if (request.isProvider){
    return Boom.forbidden();
  } 
  // extract coupon code 
  const couponCode = request.payload.coupon_code;
  delete request.payload.coupon_code;
  const order = request.payload;
  // initialize booking status
  const pendingPaymentStatus = await BookingStatuses.findOne({
    where: {
      slug: 'pending_payment'
    }
  });
  order.status_id = pendingPaymentStatus.id;
  // customer create booking doesn't require hourly rate and discount amount
  if(request.isCustomer){
    order.customer_id = request.userId;
    delete request.payload.provider_hourly_rate;
    delete request.payload.discount_amount;
  }
  // validate provider, customer, location and coupon code
  const validations = [];
  // Validate if provider exist in db and is valid
  validations.push(orderActions.validateProvider(order.provider_id));
  // Fetch customer from db
  validations.push(orderActions.validateCustomer(order.customer_id));
  // Validate if location exist in db and is valid
  validations.push(orderActions.validateLocations(order.location_id));
  // if coupon code applied
  if (couponCode) { 
    // Validate if coupon code is valid
    validations.push(orderActions.validateCoupon(couponCode));
  } else {
    // in order to keep up with array below
    validations.push(orderActions.fakePromise()); 
  }
  // if provider's addon services supplied
  if (order.addons) {
    validations.push(orderActions.validateAddOns(order.provider_id, order.addons.split(',')));
  }
  // validate all
  const [provider, customer, locationObj, coupon, addons] = await Promise.all(validations)
  // customer never specify hourly rate, while admin always
  if(request.isCustomer){
    order.provider_hourly_rate = provider.provider.hourly_rate;
  }
  // base amount
  order.total_amount = order.no_of_hours * order.provider_hourly_rate;
  // surplus addons
  if (order.addons) {
    order.total_amount += addons.reduce((val, current) => val + current.addon_price, 0);
  }
  // discounting
  let amountAfterDiscount = 0;
  if (couponCode) {
    let discountedAmount = 0;
    if (coupon.value_fixed) {
      discountedAmount = coupon.value_fixed;
      amountAfterDiscount = order.total_amount - coupon.value_fixed;
    } else {
      discountedAmount = (coupon.value_percent / 100) * order.total_amount;
      amountAfterDiscount = order.total_amount - discountedAmount;
    }
    // always be 2 decimal points
    order.discount_amount = discountedAmount.toFixed(2);
  } else {
    // when customer create order and no coupon have been applied
    if(request.isCustomer) {
      order.discount_amount = 0;
    }
    // when admin supply discount_amount
    amountAfterDiscount = order.total_amount - order.discount_amount;
  }
  // Its possible that the discount amount is greater than the total amount
  // in that case it gets to the negative so we just put 0
  // then the discount amount is the whole total amount of the order
  // if it gets negative
  const totalAmount = amountAfterDiscount <= 0 ? 0 : amountAfterDiscount;
  // amount charged to customer
  order.net_payable_amount = parseFloat((totalAmount * (1 + config.SERVICE_FEE_RATE)).toFixed(2));
  // amount forwarded to provider
  order.provider_receivable_amount = parseFloat((order.total_amount * (1 - config.WANDERSNAP_DEDUCTION_RATE)).toFixed(2));
  // start create booling process
  try {
    // insert to DB
    const obj = await Orders.create(order); 
    // add customer information
    obj.customer = customer;
    // send out notify mails
    if (provider.email) {
      const providerName = provider.first_name + ' ' + provider.last_name;
      const customerName = customer.first_name + ' ' + customer.last_name;
      emailService.sendEmail(
        provider.email, providerName, emailService.NEW_BOOKING_NOTFICATION_PROVIDER, {
          provider_name: providerName,
          customer_name: customerName,
          booking_date: order.booking_date + ' ' + order.start_time,
          destination: locationObj.title,
          id: obj.id
        }
      ).catch((err) => {
        console.log(err, 'Error sending new booking notification to provider');
      });
    }
    // mark coupon used and update ledger
    if (couponCode) {
      await Promise.all([
        CouponUses.create({
          coupon_id: coupon.id,
          user_id: request.userId,
          order_id: obj.id,
          use_dt: new Date(),
          value: order.discount_amount
        }),
        LedgerService.distributeCredit({
          customer_account: 'customer' + order.customer_id,
          amount: Math.round(order.discount_amount * 100),
          reference_data: {
            type: 'coupon',
            coupon_id: coupon.id,
            order_id: order.id
          }
        })
      ]); 
    }
    return obj;
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

controller.getAll = function (request, h) {
  return Orders.findAll({
    attributes: [
      'id', 'booking_date', 'start_time', 'customer_phone', 'meeting_venue', 'group_size',
      'booking_purpose', 'order_type', 'no_of_hours', 'total_amount', 'paid_amount',
      'discount_amount', 'wandersnap_consent', 'cancel_reason', 'created_at', 'messages_channel',
      'share_code', 'cover_photo',
      [
        sequelize.literal(
          `(
            SELECT path FROM ${Photos.getTableName()}
            WHERE ws_orders.id = ${Photos.getTableName()}.order_id
            LIMIT 1
          )`
        ), 'gallery_image'
      ]
    ],
    include: [
      {model: Events, as: 'event'},
      {model: BookingStatuses, as: 'status', attributes: ['id', 'name', 'slug']},
      {
        model: Reviews, as: request.isProvider ? 'provider_review' : 'customer_review',
        attributes: ['rating', 'review']
      },
      {model: Locations, as: 'location', attributes: ['id', 'country', 'title']},
      {
        model: Users, as: request.isProvider ? 'customer' : 'provider',
        attributes: [
          'id', 'username', 'first_name', 'last_name',
          'image', 'email', 'phone_country_code', 'phone'
        ]
      },
    ],
    where: {
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
    },
    order: [ ['id', 'DESC']]
  })
  .then((orders) => {
    return h.response(orders);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.getOne = function (request, h) {
  const orderId = request.params.order_id;

  // Public Data
  const attributes = [
    'id', 'booking_date', 'start_time', 'cover_photo', 'updated_at', 'created_at'
  ];
  const include = [
    {model: Locations, as: 'location', attributes: ['id', 'country', 'title']},
    {
      model: Users, as: 'provider',
      attributes: [
        'id', 'username', 'first_name', 'last_name', 'image',
        'email', 'phone_country_code', 'phone'
      ]
    },
    {
      model: Users, as: 'customer',
      attributes: [
        'id', 'username', 'first_name', 'last_name', 'image',
        'email', 'phone_country_code', 'phone'
      ]
    },
  ];
  const findObj = {};

  if (request.userId && helpers.isNumber(orderId)) {
    // Private data, only available when authenticated
    attributes.push(...[
      'customer_phone', 'meeting_venue', 'group_size',
      'booking_purpose', 'order_type', 'specialty', 'photography_style', 'no_of_hours',
      'nature_of_shoot', 'shoot_vision', 'total_amount', 'paid_amount', 'discount_amount',
      'wandersnap_consent', 'cancel_reason',
      'messages_channel', 'net_payable_amount', 'share_code'
    ]);
    include.push(...[
      {model: Events, as: 'event'},
      {model: BookingStatuses, as: 'status', attributes: ['id', 'name', 'slug']},
      {
        model: Reviews, as: request.isProvider ? 'provider_review' : 'customer_review',
        attributes: ['rating', 'review']
      }
    ]);
    findObj.id = orderId;
    findObj[request.isProvider ? 'provider_id' : 'customer_id'] = request.userId;
  } else {
    findObj.share_code = orderId; // Otherwise, we're gonna send share code instead of id
  }

  return Orders.findOne({
    attributes,
    include,
    where: findObj
  })
  .then((order) => {
    if (!order) {
      return Boom.notFound('Order not found!');
    }
    return h.response(order);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.getOrderEvent = function (request, h) {
  const orderId = request.params.order_id;

  return Orders.findOne({
    attributes: ['id'],
    where: {
      id: orderId
    },
    include: [
      {
        model: Events, as: 'event',
        attributes: {
          exclude: ['water_marker_logo', 'water_marker_position', 'updated_at']
        }
      },
      {
        model: Users, as: 'provider',
        attributes: ['first_name', 'last_name', 'image', 'username']
      }
    ]
  })
  .then((order) => {
    if (!order) {
      return Boom.notFound('Order not found!');
    }

    if (!order.event) {
      return Boom.notFound('Event not found');
    }

    return h.response(order);
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

controller.getEvents = function (request, h) {
  if (!request.isProvider) return Boom.unauthorized();
  return Orders.findAll({
    attributes: [
      'id', 'booking_date', 'start_time', 'meeting_venue', 'created_at',
      [
        `
          (
            SELECT count(p.id) FROM ws_photos AS p
            WHERE p.order_id = ${Orders.getTableName()}.id
          )
        `,
        'uploaded_photos'
      ]
    ],
    where: {
      provider_id: request.userId,
      event_id: sequelize.literal(`${Orders.getTableName()}.event_id IS NOT NULL`)
    },
    include: [
      {
        model: Events, as: 'event',
        attributes: {
          exclude: ['created_at', 'updated_at', 'water_marker_logo', 'overlay_image']
        }
      },
      {model: BookingStatuses, as: 'status', attributes: ['name', 'slug']}
    ],
    order: [ ['id', 'DESC']]
  })
  .then((orders) => {
    return h.response(orders);
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.updateOrder = function (request, h) {
  if (request.isProvider) return Boom.forbidden('Operation not allowed');

  const orderId = request.params.order_id;

  return Orders.findOne({
    where: {
      id: orderId,
      customer_id: request.userId
    },
    include: [
      {
        model: Users, as: 'provider',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: Users, as: 'customer',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  })
  .then((order) => {
    if (!order) {
      return Boom.notFound('Order not found!');
    }

    const emailArgs = {
      order_id: orderId,
      provider_name: order.provider.first_name + ' ' + order.provider.last_name,
      customer_name: order.customer.first_name + ' ' + order.customer.last_name,
      booking_date: request.payload.booking_date,
      start_time: request.payload.start_time,
      booking_purpose: request.payload.booking_purpose,
      group_size: request.payload.group_size,
      meeting_venue: request.payload.meeting_venue,
      customer_phone: request.payload.customer_phone,
      ws_consent: request.payload.wandersnap_consent ? 'Yes' : 'No'
    };

    return Orders.update(request.payload, {
      where: {
        id: orderId, customer_id: request.customerId
      }
    })
    .then(() => {
      emailArgs.name = emailArgs.customer_name;
    
      emailService.sendEmail(order.customer.email, emailArgs.customer_name, emailService.UPDATE_BOOKING_DETAILS, emailArgs).catch(err => {
        console.log(err, 'error sending update booking email to customer');
      });

      emailArgs.name = emailArgs.provider_name;

      emailService.sendEmail(order.provider.email, emailArgs.provider_name, emailService.UPDATE_BOOKING_DETAILS, emailArgs).catch(err => {
        console.log(err, 'error sending update booking email to provider');
      });
      return h.response({success: true, message: 'Order updated successfully'});
    })
    .catch((err) => {
      return Boom.internal(err);
    });
   
  })
  .catch((err) => {
    return Boom.internal(err);
  });
};

/**
 * After cancelling the `status_id` is changed to (cancelled) and
 * the reason of cancel is saved to `cancel_reason`
 * If user was Customer then cancelled_by_customer is set to true
 * TODO
 */
controller.cancelOrder = function (request, h) {
  const orderId = request.params.order_id;
  return Orders.findOne({
    attributes: ['id', 'booking_date', 'no_of_hours', 'start_time'],
    include: [
      {
        model: Users, as: 'customer',
        attributes: ['first_name', 'last_name', 'email', 'phone', 'phone_country_code']
      },
      {
        model: Users, as: 'provider',
        attributes: ['first_name', 'last_name', 'email', 'phone', 'phone_country_code']
      },
      {model: Locations, as: 'location', attributes: ['title']}
    ],
    where: {
      id: orderId,
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
    }
  })
  .then((order) => {
    if (!order) {
      return Boom.notFound('Order not found');
    }

    return BookingStatuses
      .findOne({where: {slug: 'cancelled'}})
      .then((status) => {
        return Orders.update({
          cancel_reason: request.payload.reason,
          cancelled_by_customer: !request.isProvider,
          status_id: status.id
        }, {where: {
          id: orderId,
          [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
        }})
        .then(() => {
          const args = {
            destination: order.location.title,
            customer_name: order.customer.first_name + ' ' + order.customer.last_name,
            date: order.booking_date
          };
          emailService.sendEmail(request.email, request.name, emailService.BOOKING_CANCELLED_PROVIDER, args);
          const notifEmailArgs = {
            provider_name: order.provider.first_name + ' ' + order.provider.last_name,
            provider_email: order.provider.email,
            provider_phone: '+' + order.provider.phone_country_code + '' + order.provider.phone,
            customer_name: args.customer_name,
            customer_email: order.customer.email,
            customer_phone: '+' + order.customer.phone_country_code + '' + order.customer.phone,
            destination: args.destination,
            booking_date: order.booking_date,
            start_time: order.start_time,
            no_of_hours: order.no_of_hours,
            order_id: order.id,
            cancel_reason: request.payload.reason,
            cancelled_by: request.isProvider ? 'refused by Snapper' : 'cancelled by Customer'
          };
          emailService.sendEmail('hey@wandersnap.co', 'Notification', emailService.ADMIN_NOTIFICATION_BOOKING_CANCELLED, notifEmailArgs);
          return h.response({success: true, message: 'Order cancelled successfully'});
        })
        .catch((err) => {
          return Boom.internal(err);
        });
      })
      .catch((err) => {
        return Boom.internal(err);
      });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.payOrder = async (request, h) => {
  // customer or admin can pay order
  if (request.isProvider){
    return Boom.forbidden();
  }
  // admin can pay as customer
  const userId = request.isCustomer ? request.userId : request.payload.customer_id;
  const orderId = request.params.order_id;
  // base currency
  const currency = 'usd';
  try {
    // get id of unpaid and schedule status from BookingStatuses
    const statuses = await BookingStatuses.findAll({
      attributes: ['id'],
      where: { 
        $or : [
          {slug: 'pending_payment'},
          {slug: 'scheduled'}
        ]
      },
      order: [
        ['id', 'ASC']
      ]
    });
    const unpaidStatus = statuses[0].id;
    const scheduledStatus = statuses[1].id;
    // get order from DB
    const order = await Orders.findOne({
      where: {
        id: orderId,
        customer_id: userId
      },
      include: [
        {
          model: Users, as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'phone_country_code', 'phone']
        },
        {
          model: Locations, as: 'location', attributes: ['title']
        },
        {
          model: Users, as: 'provider',
          attributes: ['id', 'email', 'first_name', 'last_name', 'phone_country_code', 'phone'],
          include: [
            {
              model: Providers, as: 'provider',
              attributes: ['raw_photos_per_hour', 'delivery_time', 'edits_per_hour','payout_data','auto_payable']
            }
          ]
        },
      ]
    });
    // order not found
    if (!order) {
      return Boom.notFound('Order not found');
    } 
    // pay only unpaid and there is amount to pay
    if((order.status_id == unpaidStatus) && (order.net_payable_amount > 0)) {
      const paymentReferences = {};
      // admin pay order
      if(request.isAdmin) {
        // settle amount
        const exchange = await ExchangeRates.findOne({
          where: {
            currency: 'hkd'
          }
        });
        const convertAmount = (order.net_payable_amount * exchange.rate).toFixed(2);
        // payment transaction information
        paymentReferences.transactionId = request.payload.transaction_id;
        paymentReferences.method = request.payload.payment_method;
        paymentReferences.xeroAccountId = request.payload.account_id;
        paymentReferences.isStripeCharge = false;
        paymentReferences.amount = convertAmount;
        // record ledger
        LedgerService.adminPayment(order, paymentReferences);
      }
      // customer pay order
      else {
        // charge information
        const stripeToken = request.payload.stripe_token;
        const amount = parseInt(order.net_payable_amount * 100);
        const chargePayload = {
          amount: amount,
          currency: currency,
          source: stripeToken,
          description: "Snapventure on " + order.booking_date + " " + order.start_time,
          receipt_email: order.customer.email,
          metadata: { 
            order_id: orderId
          }
        };
        // check if provider is auto-payable
        const autoPayable = order.provider.provider.auto_payable;
        const payoutData = JSON.parse(order.provider.provider.payout_data);
        // auto pay to provider
        if((autoPayable) && (payoutData.payout_method == 'stripe')) {
          chargePayload.capture = true;
          chargePayload.destination = {
            amount : parseInt(order.provider_receivable_amount * 100),
            account : payoutData.payout_identifier
          };
          paymentReferences.autoPaid = true;
        } 
        // Stripe charging
        const charge = await StripeService.charge(chargePayload);
        // payment transaction information
        paymentReferences.transactionId = charge.id;
        paymentReferences.method = charge.source && charge.source.brand;
        paymentReferences.xeroAccountId = await XeroService.getAccountId('Stripe ');
        paymentReferences.isStripeCharge = true;
        // record ledger
        charge.token = stripeToken;
        if (paymentReferences.autoPaid){
          charge.payoutIdentifier = payoutData.payout_identifier;
          LedgerService.providerAutoPayment(order, charge);
        } else {
          LedgerService.customerPayToPlatform(order, charge);
        }
      }
      // update Order payment information
      await order.update({
        status_id: scheduledStatus,
        paid_amount: order.net_payable_amount,
        paid_remark: paymentReferences.transactionId
      });
      // record Xero
      XeroService.payOrder(order, paymentReferences);
      // emails sent out
      const emailArgs = {
        provider_name: `${order.provider.first_name} ${order.provider.last_name}`,
        provider_email: order.provider.email,
        provider_phone: order.provider.phone_country_code + order.provider.phone,
        customer_email: order.customer.email,
        customer_phone: order.customer.phone_country_code + order.customer.phone,
        customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
        total_paid: order.net_payable_amount,
        payment_method: paymentReferences.method,
        transaction_id: paymentReferences.transactionId,
        order_id: order.id,
        destination: order.location && order.location.title,
        booking_date: order.booking_date,
        start_time: order.start_time,
        group_size: order.group_size,
        meeting_venue: order.meeting_venue,
        vision: order.shoot_vision,
        nature_of_shoot: order.nature_of_shoot,
        wandersnap_consent: order.wandersnap_consent ? 'Yes' : 'No',
        hourly_rate: order.provider_hourly_rate,
        no_of_hours: order.no_of_hours,
        service_fee_percent: config.SERVICE_FEE_RATE * 100, // 20%
        service_fee: order.net_payable_amount - order.total_amount,
        amount_without_fee: order.total_amount,
        discount_amount: order.discount_amount,
        total_amount: order.net_payable_amount,
        specialty: order.specialty,
        provider_deduct_fee_percent: config.WANDERSNAP_DEDUCTION_RATE * 100, // 10%
        provider_deduct_service_fee: order.total_amount - order.provider_receivable_amount,
        provider_payable_amount: order.provider_receivable_amount,
        photography_style: order.photography_style,
        raw_photos: order.no_of_hours * (order.provider && order.provider.provider.raw_photos_per_hour),
        no_of_edited_photos: (order.no_of_hours) * (order.provider && order.provider.provider.edits_per_hour),
        delivery_time: order.provider && order.provider.provider.delivery_time
      };
      emailService
        .sendEmail(order.customer.email, emailArgs.customer_name, emailService.BOOKING_CONFIRMED_CUSTOMER, emailArgs)
        .catch((err) => {
          console.log(err, 'Error sending booking confirmed to customer');
        });
      emailService
        .sendEmail(order.provider.email, emailArgs.provider_name, emailService.BOOKING_CONFIRMED_PROVIDER, emailArgs)
        .catch((err) => {
          console.log(err, 'Error sending booking confirmed to provider');
        });
      emailService
        .sendEmail(order.customer.email, emailArgs.customer_name, emailService.PAYMENT_CONFIRMED_CUSTOMER, emailArgs)
        .catch((err) => {
          console.log(err, 'Error sending payment confirmed to customer');
        });
      emailService
        .sendEmail(order.provider.email, emailArgs.provider_name, emailService.PAYMENT_CONFIRMED_PROVIDER, emailArgs)
        .catch((err) => {
          console.log(err, 'Error sending payment confirmed to provider');
        });

      return {success:true};  
    } else {
      return Boom.badRequest('This order had been paid or paying amount error');
    } 
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

controller.refundOrder = async (request, h) => {
  const orderId = request.params.order_id;
  const refundAmount = request.payload.amount;
  // Admin or Provider allow refund
  if (!(request.isAdmin || request.isProvider)){
    return Boom.forbidden();
  }
  // start refund booking
  try {
    const order = await Orders.findOne({
      attributes: [
        'id', 'customer_id', 'provider_id', 'status_id', 
        'net_payable_amount', 'refund_amount', 'paid_remark'
      ],
      where: {
        id: orderId
      }
    });
    if (!order) {
      return Boom.notFound('Order not found');
    }
    // provider can refund only belonging booking
    if (request.isProvider && (order.provider_id != request.userId)) {
      return Boom.forbidden();
    }
    // check order status and Was it refunded?
    const statuses = await BookingStatuses.findAll({
      attributes: ['id'],
      where: { 
        $or : [
          {slug: 'pending_payment'},
          {slug: 'completed'}
        ]
      },
      order: [
        ['id', 'ASC']
      ]
    });
    const pendingPaymentStatus = statuses[0].id;
    const completedStatus = statuses[1].id;
    if((order.net_payable_amount >= refundAmount) && 
      (order.refund_amount == 0) && 
      (order.status_id > pendingPaymentStatus) && 
      (order.status_id < completedStatus) &&
      (order.paid_remark.startsWith('ch_')))  {
        // process Stripe refund
        const refund = await StripeService.refund({
          charge: order.paid_remark,
          amount: Math.round(refundAmount * 100)
        });
        // update status and ledger
        await Promise.all([
          order.update({
            refund_amount: refundAmount
          }),
          LedgerService.refund({
            assetAlias: 'fare_usd',
            amount: refund.amount,
            destinationAccountId: 'customer' + order.customer_id,
            referenceData: {
              system: 'stripe',
              charge_id: refund.charge,
              refund_id: refund.id
            }
          })
        ]);
        return {success: true, message: "Booking ID: " + orderId + " was refunded successfully"};
      } else {
        return Boom.badRequest('Can\'t refund this booking');
      }
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

controller.createReview = function (request, h) {
  const {review, rating} = request.payload;
  const order_id = request.params.order_id;

  return Orders.findOne({
    attributes: [
      'id', 'customer_id', 'provider_id', 'status_id', 'provider_review_id',
      'customer_review_id'
    ],
    include: [{model: BookingStatuses, as: 'status', attributes: ['slug']}],
    where: {
      id: order_id,
      [request.isProvider ? 'provider_id' : 'customer_id']: request.userId
    }
  })
  .then((Order) => {
    if (!Order) {
      return Boom.notFound('Order not found');
    }
    // Check if review is already given or not
    if (Order[!request.isProvider ? 'customer_review_id' : 'provider_review_id']) {
      return h.response({error: true, message: 'You have already given review for this order'});
    }
    // // Check order status if it really is pending review
    if (Order.status.slug && Order.status.slug.indexOf('pending_review') < 0) {
      return h.response({error: true, message: 'Order status must be Pending Review'});
    }
    // All good, create review
    return Reviews.create({
      order_id,
      review,
      rating,
      reviewed_by: request.userId,
      review_for: request.isProvider ? Order.customer_id : Order.provider_id
      // Opposite, e.g if logged in user is provider then he's reviewing customer
    })
    .then((Review) => {
      // Update order with review id and check if both reviews are done, update the status
      // to be Completed
      const updateOrder = (statusId) => {
        const updateObj = {
          // If provider is logged in, he is leaving for customer so the review
          // is actually given by provider thats why provider_review_id
          [!request.isProvider ? 'customer_review_id' : 'provider_review_id']: Review.id
        };
        if (statusId) {
          updateObj.status_id = statusId;
        }
        return Orders.update(updateObj, {where: {id: order_id}}).then(() => {
          return h.response({success: true});
        })
        .catch((e) => {
          // delete the review because order is not updated successfully
          Review.destroy();
          console.log(e);
          return Boom.internal(e);
        });
      };
      // We check if both reviews are done, then we complete the order
      // e.g if logged in user is customer so customer_review_id will be created just now
      // so we check if provider_review_id also exist in order, that completes the
      // 2 reviews
      if (Order[!request.isProvider ? 'provider_review_id' : 'customer_review_id']) {
        // both reviews are done, lets mark this order as complete!
        // finding complete status id in db
        return BookingStatuses.findOne({
          attributes: ['id'],
          where: { slug: 'completed' }
        })
        .then((Status) => {
          return updateOrder(Status.id);
        })
        .catch((e) => {
          // delete the review because order is not updated
          Review.destroy();
          return Boom.internal(e);
        });
      } else {
        // one review is still left, lets just update order with this review id
        return updateOrder();
      }
    })
    .catch((e) => {
      console.log(e);
      return Boom.internal(e);
    });
  })
  .catch((err) => {
    console.log(err);
    return Boom.internal(err);
  });
};

controller.setCoverPhoto = function (request, h) {
  const fileId = request.payload.file_id;
  const orderId = request.params.order_id;

  if (!request.isProvider) {
    return Boom.forbidden();
  }

  return Orders.findOne({
    where: {
      id: orderId,
      provider_id: request.userId
    }
  })
  .then((order) => {
    if (!order) {
      return Boom.notFound('Order not found');
    }
    return Photos.findOne({
      where: {
        id: fileId,
        order_id: orderId
      }
    })
    .then((photo) => {
      if (!photo) {
        return Boom.notFound('Photo not found');
      }
      return Orders.update({cover_photo: photo.path},{
        where: {
          id: orderId,
          provider_id: request.userId
        }
      })
      .then(() => {
        return h.response({success: true, cover_photo: photo.path});
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.createShareGalleryLink = function (request, h) {
  const orderId = request.params.order_id;

  if (request.isProvider) {
    return Boom.forbidden();
  }

  return BookingStatuses.findAll({
    attributes: ['id', 'slug'],
    where: {
      slug: {
        $or: ['completed', 'pending_review', 'pending_approval']
      }
    }
  })
  .then((statuses) => {
    return Orders.findOne({
      where: {
        id: orderId,
        customer_id: request.userId
      }
    })
    .then((order) => {
      if (!order) {
        return Boom.notFound('Order not found');
      }
      if (statuses.map((obj) => obj.id).indexOf(order.status_id) < 0) {
        return h.response({
          error: true,
          message: `Order status should be one of ${statuses.map((obj) => obj.slug).join(', ')}`
        });
      }
      if (order.share_code) {
        return h.response({success: true, share_code: order.share_code});
      }
      const shareCode = shortid.generate();
      return Orders.update({share_code: shareCode},{
        where: {
          id: orderId,
        }
      })
      .then(() => {
        return h.response({success: true, share_code: shareCode});
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

controller.approveOrderGallery = function (request, h) {
  if (request.isProvider) {
    return Boom.forbidden();
  }

  return BookingStatuses.findOne({
    attributes: ['id'],
    where: {
      slug: 'pending_review'
    }
  })
  .then((status) => {
    return Orders.findOne({
      attributes: ['id'],
      where: {
        id: request.params.order_id
      },
      include: [{model: BookingStatuses, as: 'status', attributes: ['id', 'slug']}]
    })
    .then((order) => {
      if (!order) {
        return Boom.notFound('Order not found');
      }
      if (order.status.slug !== 'pending_approval') {
        return h.response({
          error: true,
          message: `Status Error: You can not transition from ${order.status.slug} to pending_review`
        });
      }
      // Everything good, change it to pending_review
      return Orders.update({
        status_id: status.id
      }, {where: {id: order.id}}).then(() => {
        // Notify admin
        emailService.sendEmail(
          'hey@wandersnap.co', 'Notification',
          emailService.ADMIN_NOTIFICATION_GALLERY_APPROVED,
          {order_id: order.id}
        );
        return h.response({success: true});
      })
      .catch((e) => {
        return Boom.internal(e);
      });
    })
    .catch((e) => {
      return Boom.internal(e);
    });
  })
  .catch((e) => {
    return Boom.internal(e);
  });
};

/**
 * This endpoint is for both public and for Users which are logged in. When a user hits
 * it with order_id that has event, no validations are required. But if a user hits this
 * with an order_id that doens't have event, means that order isn't public. We now validate
 * it with the `auth` query param which contains JWT. If its not there. Errors. If `auth` is
 * present, we then check user_id with orders' provider_id and customer_id to check if
 * authorised user is requesting that resource.
 */
controller.downloadOrderPictures = function (request, h) {
  const orderId = request.params.order_id;
  const authToken = request.query.auth;
  let isPublic = false;
  const filterObj = {};

  if (helpers.isNumber(orderId)) {
    filterObj.id = orderId;
  } else {
    filterObj.share_code = orderId;
    isPublic = true;
  }

  return Orders.findOne({
    attributes: ['id', 'booking_date', 'provider_id', 'customer_id'],
    where: filterObj,
    include: [{model: Events, as: 'event', attributes: ['title']}]
  })
  .then((obj) => {
    const downloadAsZip = () => {
      // Ready to go, zip it and stream it to client's browser ;)
      return S3ZipperService.zipWithStream(`orders/${obj.id}/compressed`).then((stream) => {
        const eventTitle = obj.event ? obj.event.title : 'booking on ' + obj.booking_date;
        const fileName = slug(eventTitle, '_');
        return h.response(stream)
          .header('Content-Type', 'application/x-zip-compressed')
          .header('Content-Disposition', `attachment; filename=${fileName}.zip`);
      })
      .catch((e) => {
        console.log(e);
        return h.response('Something went wrong while fetching the resource. Try again later');
      });
    };

    if (!obj) {
      return h.response('OOpsies. Your requested resource was not found in the server');
    }

    // Probably a shareable URL
    if (isPublic) {
      return downloadAsZip();
    }

    if (!obj.event && !authToken) {
      // Private resource, not allowed
      return h.response('OOpsies. You are not allowed to access the requested resource');
    }

    if (!obj.event && authToken) {
      return VerifyJWTService.verify(authToken).then((user) => {
        if (obj.provider_id == user.userId || obj.customer_id == user.userId) {
          return downloadAsZip();
        } else {
          return h.response('OOpsies. You are not allowed to access the requested resource');
        }
      })
      .catch((err) => {
        console.log(err);
        return h.response('Invalid Token');
      });
    } else {
      return downloadAsZip();
    }
  })
  .catch((e) => {
    console.log(e);
    // hing via plain text as this will be utilised directly in browser so
    // it makes sense to just throw plain text so User can also understand whats
    // happening
    return h.response('Something went wrong while reading from DB. Try again later');
  });
};

controller.vacateOrder = async (request, h) => {
  const orderId = request.params.order_id;
  // Admin allowed vacate the booking
  if (!request.isAdmin){
    return Boom.forbidden();
  }
  try {
    const order = await Orders.findOne({
      attributes: [
        'id', 'provider_id', 'provider_receivable_amount'
      ],
      where: {
        id: orderId
      }
    });
    if (!order) {
      return Boom.notFound('Booking not found');
    }
    // can vacate only assigned booking
    if (order && order.provider_id != config.WANDERSNAP_CREW_USER_ID) {
      await Promise.all([
        // do update ledger by transfer from provider account to processing account
        LedgerService.unassignProvider({
          order_id: order.id,
          provider_id: order.provider_id,
          amount: Math.round(100 * order.provider_receivable_amount)
        }),
        //update booking
        order.update({
          provider_id: config.WANDERSNAP_CREW_USER_ID
        })
      ]);
      return {success: true};
    } else {
      return Boom.forbidden('This booking was vacancy');
    }
  } catch (err) {
    console.log(err);
    return Boom.internal(err);
  }
};

controller.acceptOrder = async (request, h) => {
  const orderId = request.params.order_id;
  // Provider allowed accept the order recruition
  if (!request.isProvider) {
    return Boom.forbidden();
  } 
  try {
    const order = await Orders.findOne({
      attributes: [
        'id', 'provider_receivable_amount'
      ],
      where: {
        id: orderId,
        provider_id: config.WANDERSNAP_CREW_USER_ID
      }
    });
    if (!order) {
      return Boom.notFound('Booking not found');
    }
    await Promise.all([
      // do update ledger by transfer from processing account to provider account
      LedgerService.assignProvider({
        order_id: order.id,
        provider_id: request.userId,
        amount: Math.round(100 * order.provider_receivable_amount)
      }),
      // update booking
      order.update({
        provider_id: request.userId
      })
    ]);
    // send notify email to admin
    emailService.sendEmail(
      config.ADMIN_EMAIL, 'Notification',
      emailService.ADMIN_NOTIFICATION_BOOKING_ACCEPTED,
      {order_id: order.id}
    ).catch(err => {
      console.log(err, 'Error sending booking accepted notification to admin');
    });
    return {success: true};
  } catch (err) {
    console.log(err);
    throw Boom.internal(err);
  }
};

module.exports = controller;
