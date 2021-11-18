const Users = require('../models/Users');
const Providers = require('../models/Providers');
const sequelize = require('../../config/sequelize');
const Locations = require('../models/Locations');
const Specialties = require('../models/Specialties');
const builder = require('xmlbuilder');

const controller = {};

controller.getSitemap = async function (request) {
  const [users, locations, specialties] = await Promise.all([
    Users.findAll({
      attributes: ['id', 'username'],
      where: {
        provider_id: sequelize.literal(`\`${Users.getTableName()}\`.\`provider_id\` IS NOT NULL`),
      },
      include: [{
        model: Providers, as: 'provider',
        where: {visible_in_search: true, profile_completed: true},
        attributes: ['id']
      }]
    }),
    Locations.findAll({attributes: ['id', 'key']}),
    Specialties.findAll({attributes: ['id', 'name']})
  ]);
  const links = [
    'https://wandersnap.co',
    'https://wandersnap.co/become-a-traveller',
    'https://wandersnap.co/auth/login',
    'https://wandersnap.co/auth/signup/customer',
    'https://wandersnap.co/auth/signup/provider',
    'https://wandersnap.co/family-photos-hire-photographer',
    'http://live.wandersnap.co/story',
    'https://wandersnap.co/press',
    'https://wandersnap.co/privacy',
    'https://wandersnap.co/terms',
    'https://wandersnap.co/copyright',
    'https://wandersnap.co/search',
    'https://wandersnap.co/impact',
    'https://wandersnap.co/partnerships',
    'http://live.wandersnap.co/photographers-on-wandersnap',
    'https://wandersnap.co/blog',
    'http://live.wandersnap.co/how-photographer-on-demand-works',
    'https://wandersnap.co/connect',
    'http://live.wandersnap.co/family-photos-hire-photographer',
    'http://live.wandersnap.co/live-photos',
    'http://live.wandersnap.co/cinemagraph',
    'http://live.wandersnap.co/event-photographer',
    'http://live.wandersnap.co/ecommerce-photos-hire-photographer',
    'http://live.wandersnap.co/business',
    'http://live.wandersnap.co/travel-photographer-instagram-vacation',
    'http://live.wandersnap.co//newly-engaged-couples',
    'http://live.wandersnap.co/newly-engaged-photos-engagement',
    'http://live.wandersnap.co/business',
    'http://live.wandersnap.co/anniversary-with-a-personal-photographer',
  ]

  const generateUrlElement = (link, node) => {
    const url = node.ele('url');
    url.ele('loc', {}, link);
    url.ele('priority', {}, '0.5');
    return url;
  }
  const urlSet = builder.create('urlset');
  urlSet.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  links.forEach((link) => {
    generateUrlElement(link, urlSet);
  })

  users.forEach((user) => {
    if (user.username) {
      generateUrlElement(`https://wandersnap.co/user/${user.username}`, urlSet);
    }
  });

  locations.forEach((location) => {
    generateUrlElement(`https://wandersnap.co/s/city/${location.key}`, urlSet);
    generateUrlElement(`https://wandersnap.co/search/${location.key}`, urlSet);
    specialties.forEach((specialty) => {
      generateUrlElement(`https://wandersnap.co/s/city/${location.key}/style/${specialty.name}`, urlSet);
    })
  });

  return urlSet.end();
};

module.exports = controller;
