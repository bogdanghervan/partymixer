var config = {};

config.url = process.env.APP_URL || 'http://partymixer.local';
config.port = process.env.PORT || '3000';

// Sign up with Pusher for a key/secret pair at
// @see https://pusher.com/signup
config.pusher = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'mt1'
};

// Create a Facebook app at
// @see https://developers.facebook.com/apps
config.facebook = {
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  callbackUrl: (config.url + ':' + config.port + '/auth/facebook/callback')
};

// You will need a YouTube browser key to access Data API v3
// @see https://developers.google.com/youtube/registering_an_application
config.youtube = {
  key: process.env.YOUTUBE_KEY
};

// Other configuration with sensible defaults for localhost
config.database = {
  username: process.env.DB_USERNAME || "partymixer",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_DATABASE || "partymixer",
  host: process.env.DB_HOST || "127.0.0.1",
  dialect: "mysql"
};

config.redisStore = {
  url: process.env.REDIS_URL || '//127.0.0.1:6379',
  secret: process.env.REDIS_SECRET || "it's a secret"
};

module.exports = config;
