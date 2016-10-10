var express = require('express');
var router = express.Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var Party = require('../models').Party;
var Song = require('../models').Song;

/**
 * GET new party page
 */
router.get('/new',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    res.render('parties/new', {
      user: req.user
    });
});

/* POST new party */
router.post('/',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    var name = req.param('name');
    // TODO: ensure this is really unique
    var hash = Party.generateHash();

    Party.create({
      name: name,
      hash: hash,
      userFacebookId: req.user.id
    }).then(function () {
      res.redirect('/parties/' + hash);
    });
  });

/* GET party profile page */
router.get('/:partyId',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    res.json(req.params);
  });

/* GET party playlist */
router.get('/:partyId/songs',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    res.send('respond with a resource');
  });

/* POST song to party playlist */
router.post('/:partyId/songs',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    res.send('respond with a resource');
  });

module.exports = router;
