var express = require('express');
var router = express.Router();

var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;

var config = require('./config');

router.get('/facebook', passport.authenticate('facebook'));

// TODO: handle failure better
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/error'
  }),
  function (req, res) {
    res.redirect('/');
  });

function initPassport () {
  passport.use(new Strategy({
      clientID: config.facebook.appId,
      clientSecret: config.facebook.appSecret,
      callbackURL: config.facebook.callbackUrl
    },
    function(accessToken, refreshToken, profile, cb) {
      // TODO: associate with a user record in the database
      return cb(null, profile);
    }
  ));

  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });

  return passport;
}

module.exports = {
  initPassport: initPassport,
  routes: router
};