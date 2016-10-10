var config = {};

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
