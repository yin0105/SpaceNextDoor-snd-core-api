'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('ws_booking_statuses', [
      {"id":1, "name":"Pending Payment", "slug":"pending_payment", "note":"", "created_at": new Date(), "updated_at": new Date()},
      {"id":2, "name":"Scheduled", "slug":"scheduled", "note":"paid but not yet show", "created_at": new Date(), "updated_at": new Date()},
      {"id":3, "name":"Pending Upload", "slug":"pending_upload", "note":"after shooting date without gallery", "created_at": new Date(), "updated_at": new Date()},
      {"id":4, "name":"Pending Approval", "slug":"pending_approval", "note":"after gallery uploaded but not yet approved", "created_at": new Date(), "updated_at": new Date()},
      {"id":5, "name":"Pending Review", "slug":"pending_review", "note":"after gallery is approved but review is not given", "created_at": new Date(), "updated_at": new Date()},
      {"id":6, "name":"Completed", "slug":"completed", "note":"independent from ratings or remittance statuses", "created_at": new Date(), "updated_at": new Date()},
      {"id":7, "name":"Cancelled", "slug":"cancelled", "note":"", "created_at": new Date(), "updated_at": new Date()}
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ws_booking_statuses', null, {});
  }
};
