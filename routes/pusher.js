var express = require('express');
var router = express.Router();
var config = require('../config');
var Pusher = require('pusher');
var pusher = new Pusher(config.pusher);

/**
 * Authentication endpoint for Pusher.
 * The Pusher client pings this when subscribing to private
 * and presence channels.
 * @see https://pusher.com/docs/authenticating_users
 */
router.post('/auth', function (req, res) {
  if (!req.user) {
    return res.sendStatus(403);
  }

  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  if (!socketId || !channel) {
    return res.sendStatus(400);
  }

  var presenceData = {
    user_id: req.user.id,
    user_info: {
      name: req.user.name
    }
  };
  var auth = pusher.authenticate(socketId, channel, presenceData);
  res.send(auth);
});

module.exports = router;
