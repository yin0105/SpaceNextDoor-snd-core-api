
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.WS_PUSHER_APP_ID || '443419',
  key: process.env.WS_PUSHER_APP_KEY || 'a21eb8876637f56c3de0',
  secret: process.env.WS_PUSHER_APP_SECRET || '15bbd9dc90e3c3d48a61',
  cluster: 'ap1'
});

module.exports = pusher;
