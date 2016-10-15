var express = require('express');
var router = express.Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var config = require('../config');
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
router.get('/:partyHash',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    var hash = req.param('partyHash');

    Party.find({
      where: { hash: hash }
    }).then(function(party) {
      if (party) {
        res.render('parties/details', {
          layout: 'realtime',
          pusher: config.pusher,
          user: req.user,
          party: party
        });
      } else {
        res.status(404).render('error', {
          message: 'Party not found'
        });
      }
    });
  });

/* GET party playlist */
router.get('/:partyHash/songs',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    var hash = req.param('partyHash');

    Party.findOne({
      where: { hash: hash }
    }).then(function(party) {
      Song.findAndCountAll({
        attributes: ['youtubeVideoId', 'name', 'order'],
        where: { PartyId: party.id },
        order: [
          ['order', 'DESC'],
          ['createdAt', 'ASC']
        ]
      }).then(function (songs) {
        res.json(songs);
      });
    });
  });

/* POST song to party playlist */
router.post('/:partyHash/songs',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    res.send('respond with a resource');
  });

module.exports = router;
