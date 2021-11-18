const async = require('async');
const mandrill = require('node-mandrill')(process.env.WS_MAILCHIMP_MANDRILL);
const {SITE_URL} = require('../../config');

const service = {
  SIGN_UP_CUSTOMER: 'SIGN_UP_CUSTOMER',
  PRE_SIGN_UP_CUSTOMER: 'PRE_SIGN_UP_CUSTOMER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  SIGN_UP_PROVIDER: 'SIGN_UP_PROVIDER',
  UPDATE_BOOKING_DETAILS: 'UPDATE_BOOKING_DETAILS',
  BOOKING_CANCELLED_PROVIDER: 'BOOKING_CANCELLED_PROVIDER',
  PAYMENT_CONFIRMED_CUSTOMER: 'PAYMENT_CONFIRMED_CUSTOMER',
  PAYMENT_CONFIRMED_PROVIDER: 'PAYMENT_CONFIRMED_PROVIDER',
  BOOKING_CONFIRMED_PROVIDER: 'BOOKING_CONFIRMED_PROVIDER',
  BOOKING_CONFIRMED_CUSTOMER: 'BOOKING_CONFIRMED_CUSTOMER',
  PROFILE_COMPLETION_PROVIDER: 'PROFILE_COMPLETION_PROVIDER',
  NEW_BOOKING_NOTFICATION_PROVIDER: 'NEW_BOOKING_NOTFICATION_PROVIDER',
  ADMIN_NOTIFICATION_GALLERY_APPROVED: 'ADMIN_NOTIFICATION_GALLERY_APPROVED',
  ADMIN_NOTIFICATION_BOOKING_CANCELLED: 'ADMIN_NOTIFICATION_BOOKING_CANCELLED',
  ADMIN_NOTIFICATION_BOOKING_ACCEPTED: 'ADMIN_NOTIFICATION_BOOKING_ACCEPTED',
};

const types = {
  UPDATE_BOOKING_DETAILS: {
    template: 'snapventure-changed-notification',
    subject: 'Booking details were Updated',
    data: {},
    templateContent: function () {
      return Object.keys(this.data).map((field) => (
        {name: field, content: this.data[field] || 'N/A'}
      ));
    }
  },
  ADMIN_NOTIFICATION_BOOKING_CANCELLED: {
    template: 'for-admin-request-cancelled-refused',
    subject: 'Booking Cancelled',
    data: {},
    templateContent: function () {
      return [
        'provider_name', 'provider_phone', 'provider_email', 'cancelled_by',
        'order_id', 'booking_date', 'start_time', 'no_of_hours', 'destination',
        'customer_name', 'customer_phone', 'customer_email', 'cancel_reason'
      ].map((field) => (
        {name: field, content: this.data[field] || 'N/A'}
      ));
    }
  },
  ADMIN_NOTIFICATION_BOOKING_ACCEPTED: {
    template: 'for-admin-booking-accepted-by-snapper',
    subject: 'Booking Accepted by Snapper',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'link',
          'content': `<a href="${SITE_URL}/admin/ws-orders/view?id=${this.data.order_id}">${this.data.order_id}</a>`
        }
      ];
    }
  },
  ADMIN_NOTIFICATION_GALLERY_APPROVED: {
    template: 'for-admin-gallery-approved-by-guest',
    subject: 'Gallery Approved',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'order_id',
          'content': this.data.order_id
        },
        {
          'name': 'galleryLink',
          'content': `<a href="">No link</a>`
        }
      ];
    }
  },
  NEW_BOOKING_NOTFICATION_PROVIDER: {
    template: 'approval-needed-for-booking-request',
    subject: 'You have a NEW Booking! - WanderSnap',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'customer_name',
          'content': this.data.customer_name
        },
        {
          'name': 'name',
          'content': this.data.provider_name
        },
        {
          'name': 'destination',
          'content': this.data.destination
        },
        {
          'name': 'booking_date',
          'content': this.data.booking_date
        },
        {
          'name': 'link',
          'content': `<a class="mcnButton " title="Say hello to new guest" href="${SITE_URL}/bookings?booking_id=${this.data.id}" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Say hello to new guest</a>`
        }
      ];
    }
  },
  SIGN_UP_CUSTOMER: {
    template: 'Signup welcome - traveller',
    subject: 'Welcome to WanderSnap'
  },
  PRE_SIGN_UP_CUSTOMER: {
    template: 'complete-your-signup',
    subject: 'Welcome to WanderSnap',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'link',
          'content': `<a class="mcnButton " title="Complete Signup" href="${SITE_URL}/auth/signup/customer/${this.data.token}" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Complete Signup</a>`
        }
      ];
    }
  },
  FORGOT_PASSWORD: {
    template: 'Forget Password',
    subject: 'Reset Password',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'button',
          'content': `<a class="mcnButton " title="Reset Password" href="${this.data.url}" target="_blank" style="font-weight: bold;letter-spacing: 1px;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Reset Password</a>`
        }
      ];
    }
  },
  SIGN_UP_PROVIDER: {
    template: 'Signup welcome - snapper',
    subject: 'Welcome to WanderSnap'
  },
  BOOKING_CANCELLED_PROVIDER: {
    template: 'Booking refused - to snapper',
    subject: 'You cancelled the booking',
    data: {},
    templateContent: function () {
      return [
        {
          'name': 'destination',
          'content': this.data.destination
        },
        {
          'name': 'customer_name',
          'content': this.data.customer_name
        },
        {
          'name': 'date',
          'content': this.data.date
        }
      ];
    }
  },
  PAYMENT_CONFIRMED_CUSTOMER: {
    template: 'payment-confirmation-to-traveller',
    subject: 'Payment received',
    data: {},
    templateContent: function () {
      const fields = [
        'name', 'provider_name', 'provider_phone', 'provider_email', 'customer_name', 'customer_phone', 'customer_email',
        'total_paid', 'payment_method', 'transaction_id', 'order_id', 'destination', 'booking_date', 'start_time',
        'group_size', 'meeting_venue', 'vision', 'nature_of_shoot', 'wandersnap_consent', 'hourly_rate', 'no_of_hours',
        'amount_without_fee', 'service_fee_percent', 'service_fee', 'discount_amount', 'total_amount', 'specialty',
        'photography_style', 'raw_photos', 'no_of_edited_photos', 'delivery_time'
      ].map((field) => ({name: field, content: this.data[field]}));
      fields.push({
        name: 'btn',
        content: `<a class="mcnButton " title="View Order Details" href="${SITE_URL}/bookings?booking_id=${this.data.order_id}" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View Order Details</a>`
      });
      return fields;
    }
  },
  PAYMENT_CONFIRMED_PROVIDER: {
    template: 'payment-confirmation-to-snapper',
    subject: 'Payment confirmed',
    data: {},
    templateContent: function () {
      const fields = [
        'provider_name', 'provider_phone', 'provider_email', 'customer_name', 'customer_phone', 'customer_email',
        'total_paid', 'payment_method', 'transaction_id', 'order_id', 'destination', 'booking_date', 'start_time',
        'group_size', 'meeting_venue', 'vision', 'nature_of_shoot', 'wandersnap_consent', 'hourly_rate', 'no_of_hours',
        'amount_without_fee', 'provider_deduct_fee_percent', 'provider_deduct_service_fee', 'provider_payable_amount', 'total_amount', 'specialty',
        'photography_style', 'raw_photos', 'no_of_edited_photos', 'delivery_time'
      ].map((field) => ({name: field, content: this.data[field]}));
      fields.push({
        name: 'btn',
        content: `<a class="mcnButton " title="View Order Details" href="${SITE_URL}/bookings?booking_id=${this.data.order_id}" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View Order Details</a>`
      });
      return fields;
    }
  },
  BOOKING_CONFIRMED_PROVIDER: {
    template: 'Booking confirmed - to snapper',
    subject: 'Booking Confirmed', 
    data: {},
    templateContent: function () {
      return ['destination', 'booking_date', 'customer_name'].map((field) => (
        {name: field, content: this.data[field] || 'N/A'}
      ));
    }
  },
  BOOKING_CONFIRMED_CUSTOMER: {
    template: 'Booking confirmed - to traveller',
    subject: 'Your Booking is Confirmed', 
    data: {},
    templateContent: function () {
      const fields = ['destination', 'booking_date', 'customer_name', 'provider_name'].map((field) => (
        {name: field, content: this.data[field] || 'N/A'}
      ));
      fields.push({
        name: 'btn', 
        content: `<a class="mcnButton " title="Make Payment Now" href="${SITE_URL}/bookings/${this.data.order_id}/payment" target="_blank" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Make Payment Now</a>`
      });
      return fields;
    }
  },
  PROFILE_COMPLETION_PROVIDER: {
    template: '100-profile-completion',
    subject: 'Your Profile is 100% complete', 
    data: {},
    templateContent: function () {
      return [
        {name: 'provider_name', content: this.data.name}
      ];
    }
  }
};
/**
 * @param  {String} email - Email of the recepient
 * @param  {String} name - Name of the recepient
 * @param  {String} type - Type of the email template, we've above mentioned valid templates
 * @return {Promise} promise;
 */
service.sendEmail = function (email, name, type, data) {
  if (!email) {
    throw 'Email is required';
  }
  if (!name) {
    throw 'Name is required';
  }
  if (!type) {
    throw 'Type of the email is required, like SIGN_UP_CUSTOMER';
  }
  if (!service[type]) {
    throw 'Specified type is not valid';
  }
  const templateObj = types[type];
  templateObj.data = data;

  const sendEmailWrapper = (cb) => {
    mandrill('/messages/send-template', {
      template_name: templateObj.template,
      // idk why this value is required by mandrill, this is not being used
      template_content: (templateObj.templateContent && templateObj.templateContent()) || [],
      message: {
        to: [{email, name}],
        from_email: 'notifications@wandersnap.co',
        from_name: 'WanderSnap',
        track_opens: true,
        track_clicks: true,
        subject: types[type].subject,
      }
    }, function(error, response)
    {
      //uh oh, there was an error
      if (error) return cb(error, null);
      else return cb(null, response);
    });
  };
  
  const promise = new Promise((resolve, reject) => {
    // retry 3 times with 100ms, 200ms, 300ms delay
    async.retry({
      times: 3,
      interval: (retryCount) => 50 * Math.pow(2, retryCount)
    }, sendEmailWrapper, function(err, result) {
      if (err) return reject(err);
      return resolve(result);
    });
  });

  return promise;
};

module.exports = service;