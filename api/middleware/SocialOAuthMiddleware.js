
module.exports = function (server) {

  const facebookId = process.env.WANDERSNAP_FB_ID || '954814554665683';
  const facebookSecret = process.env.WANDERSNAP_FB_SECRET || '5d5848b9c34c55e0032b1ea493df9536';

  server.auth.strategy('facebook', 'bell', {
    provider: 'facebook',
    scope: ['email', 'public_profile'],
    password: 'cookie_encryption_password_secure',
    clientId: facebookId,
    clientSecret: facebookSecret,
    isSecure: false
  });

  server.auth.strategy('google', 'bell', {
    provider: 'google',
    password: 'asdlfjasnfklansflkasasdfasfasfsafafsdfaf',
    clientId: '317863405431-tf4kv0tkaubp5po17t0ol479ibpf6mij.apps.googleusercontent.com',
    clientSecret: 'GZ2wkjgl2lHt6-cvQyGYXrzp',
    isSecure: false
  });

  server.auth.strategy('instagram', 'bell', {
    provider: 'instagram',
    scope: ['basic'],
    password: 'asdlfjasnfdafsdfklansflkasdafsfdsasdfasfasfsafafsdfaf',
    clientId: 'e392919c530144a48a22fbea48cea5be',
    clientSecret: '72dbdad2f6ac423298153b7f3875c4aa',
    isSecure: false
  });
};
