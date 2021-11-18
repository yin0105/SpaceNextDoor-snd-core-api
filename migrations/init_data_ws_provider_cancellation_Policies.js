'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('ws_provider_cancellation_policies', [
      {"id":1, "name":"Strict", "slug":"strict", "days_to_cancel_before": 0, "cancel_penalty_percent": 1, "no_show_penalty_percent": 1, "created_at": new Date(), "updated_at": new Date()},
      {"id":2, "name":"Moderate", "slug":"moderate", "days_to_cancel_before": 3, "cancel_penalty_percent": 0.5, "no_show_penalty_percent": 1, "created_at": new Date(), "updated_at": new Date()},
      {"id":3, "name":"Flexible", "slug":"flexible", "days_to_cancel_before": 1, "cancel_penalty_percent": 0.3, "no_show_penalty_percent": 1, "created_at": new Date(), "updated_at": new Date()},
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ws_provider_cancellation_policies', null, {});
  }
};
