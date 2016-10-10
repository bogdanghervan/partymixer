var config = {};

// TODO: move sensitive credentials outside
config.pusher = {
  appId: process.env.PUSHER_APP_ID || '257380',
  key: process.env.PUSHER_KEY || 'bbadc879bf68a089665f',
  secret: process.env.PUSHER_SECRET || '261a043f2f954e48cfb2'
};

config.redisStore = {
  url: process.env.REDIS_STORE_URL || '//192.168.110.10:6379',
  secret: 'p1CwLqYMiyw4bACS3K7RNMp9eCboe1Vq'
};

config.facebook = {
  appId: process.env.FACEBOOK_APP_ID || '738807596278619',
  appSecret: process.env.FACEBOOK_APP_SECRET || '7a1a1f10acfd66cffebe281546b54d84',
  callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://partymixer.local:3000/auth/facebook/callback'
}

module.exports = config;
