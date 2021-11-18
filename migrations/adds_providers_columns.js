'use strict';

module.exports = {

  up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(function handleTransaction (t) {
      return Promise.all([
        queryInterface.addColumn('ws_providers', 'delivery_time', Sequelize.INTEGER, {transaction: t}),
        queryInterface.addColumn('ws_providers', 'camera_type', Sequelize.STRING(255), {transaction: t}),
        queryInterface.addColumn('ws_providers', 'languages', Sequelize.STRING(255), {transaction: t}),
        queryInterface.addColumn('ws_providers', 'website_link', Sequelize.STRING(255), {transaction: t}),
        queryInterface.addColumn('ws_providers', 'social_media_links', Sequelize.TEXT, {transaction: t}),
        queryInterface.addColumn('ws_providers', 'cancellation_policy_id', Sequelize.INTEGER, {transaction: t})
      ]);
    });
  },
 
  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(function handleTransaction (t) {
      return Promise.all([
        queryInterface.removeColumn('ws_providers', 'delivery_time', {transaction: t}),
        queryInterface.removeColumn('ws_providers', 'camera_type', {transaction: t}),
        queryInterface.removeColumn('ws_providers', 'languages',  {transaction: t}),
        queryInterface.removeColumn('ws_providers', 'website_link',  {transaction: t}),
        queryInterface.removeColumn('ws_providers', 'social_media_links',  {transaction: t}),
        queryInterface.removeColumn('ws_providers', 'cancellation_policy_id',  {transaction: t})
      ]);
    });
  }
};

/*
ALTER TABLE `ws_providers` 
ADD COLUMN `delivery_time` INT NULL AFTER `max_group_size`,
ADD COLUMN `camera_type` VARCHAR(255) NULL AFTER `delivery_time`,
ADD COLUMN `languages` VARCHAR(255) NULL AFTER `camera_type`,
ADD COLUMN `website_link` VARCHAR(255) NULL AFTER `languages`,
ADD COLUMN `social_media_links` TEXT NULL AFTER `website_link`,
ADD COLUMN `cancellation_policy_id` INT NULL AFTER `social_media_links`;
*/