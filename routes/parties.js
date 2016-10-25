var express = require('express');
var router = express.Router();
var _ = require('lodash');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var config = require('../config');
var sequelize = require('../models').sequelize;
var Party = require('../models').Party;
var Song = require('../models').Song;
var Pusher = require('pusher');
var pusher = new Pusher(config.pusher);

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
    var name = req.body.name;
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

/* GET party page */
router.get('/:partyHash',
  ensureLoggedIn('/auth/facebook'),
  function(req, res) {
    var hash = req.params.partyHash;

    Party.findOne({
      where: { hash: hash }
    }).then(function (party) {
      if (!party) {
        return pageNotFound(res, 'Party not found');
      }

      res.render('parties/details', {
        layout: 'party',
        pusher: config.pusher,
        youtube: config.youtube,
        user: req.user,
        isHost: (req.user.id == party.userFacebookId),
        party: party
      });
    });
  });

/* GET search page */
router.get('/:partyHash/search',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    var hash = req.params.partyHash;

    Party.findOne({
      where: { hash: hash }
    }).then(function (party) {
      if (!party) {
        return pageNotFound(res, 'Party not found');
      }

      res.render('parties/search', {
        layout: 'party',
        pusher: config.pusher,
        youtube: config.youtube,
        user: req.user,
        isHost: (req.user.id == party.userFacebookId),
        party: party
      });
    });
  });

/* POST song to party playlist */
router.post('/:partyHash/songs',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    var hash = req.params.partyHash;

    findParty(hash).then(function (party) {
      if (!party) {
        return errorNotFound(res, 'Party not found');
      }

      var youtubeVideoId = req.body.youtubeVideoId;
      var name = req.body.name;

      return Song.create({
        youtubeVideoId: youtubeVideoId,
        userFacebookId: req.user.id,
        name: name,
        PartyId: party.id
      });
    }).then(function (song) {
      if (!song) {
        throw new Error('Song could not be queued');
      }
      var songData = song.getPublicData();
      pusher.trigger(hash, 'song-added', songData);

      return songData;
    }).then(function (song) {
      res.status(201).json(song);
    }, function (error) {
      errorGeneralError(res, error);
    });
  });

/* TODO: create middleware for handling errors for API-like requests */
/* GET party playlist */
router.get('/:partyHash/songs',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    var hash = req.params.partyHash;

    findParty(hash).then(function (party) {
      if (!party) {
        return errorNotFound(res, 'Party not found');
      }
      Song.findAll({
        attributes: [
          'id', 'youtubeVideoId', 'userFacebookId', 'name',
          'status', 'voteCount', ['createdAt', 'queuedAt']
        ],
        where: {
          PartyId: party.id,
          status: {
            $in: ['queued', 'playing', 'paused']
          }
        },
        order: [
          ['status', 'DESC'],
          ['voteCount', 'DESC'],
          ['createdAt', 'ASC']
        ]
      }).then(function (songs) {
        res.json(songs);
      });
    });
  });

/**
 * GET /parties/:partyHash/songs/current
 *
 * Retrieves special entity that represents the song that is
 * currently loaded (can be either "playing" or "paused").
 */
router.get('/:partyHash/songs/current',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    var hash = req.params.partyHash;

    findParty(hash).then(function (party) {
      if (!party) {
        return errorNotFound(res, 'Party not found');
      }
      Song.findOne({
        attributes: [
          'id', 'youtubeVideoId', 'userFacebookId', 'name',
          'status', 'voteCount', ['createdAt', 'queuedAt']
        ],
        where: {
          PartyId: party.id,
          status: {
            $in: ['playing', 'paused']
          }
        }
      }).then(function (song) {
        if (!song) {
          return errorNotFound(res, 'No song is currently loaded');
        }
        res.json(song);
      });
    });
  });

/**
 * POST /parties/:partyHash/songs/current
 *
 * Post to this special entity to either update the status
 * of the song that's currently loaded by posting a new status,
 * or advance to the next song by posting the ID of the next song.
 */
router.post('/:partyHash/songs/current',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    // TODO: validate input
    var hash = req.params.partyHash;

    findParty(hash).then(function (party) {
      if (!party) {
        return errorNotFound(res, 'Party not found');
      }
      var excludeSocketId = req.body.socketId;

      // Update status
      if ('status' in req.body) {
        // TODO: validate that status is either "playing" or "paused"
        var status = req.body.status;
        updateCurrentSongStatus(party, status).then(function (song) {
          var payload = _.pick(song, ['id', 'status']);
          pusher.trigger(hash, 'song-status-changed', payload, excludeSocketId);

          res.json(song.getPublicData());
        }, function (error) {
          return errorGeneralError(res, error);
        });

      // Advance to next song (or play first song)
      } else if ('songId' in req.body) {
        var newSongId = req.body.songId;

        updateCurrentSongStatus(party, Song.Status.ENDED)  // if any
          .catch(function () {})
          .then(function () {
            return advanceSong(party, newSongId);
          })
          .then(function (song) {
            var payload = _.pick(song, ['id', 'status']);
            pusher.trigger(hash, 'next-song', payload, excludeSocketId);

            res.json(song.getPublicData());
          }, function (error) {
            return errorGeneralError(res, error);
          });
      } else {
        return errorGeneralError(res, 'Bad request');
      }
    });
  });

/**
 * POST /parties/:partyHash/songs/:songId/votes
 *
 * Registers a vote for a song.
 */
router.post('/:partyHash/songs/:songId/votes',
  ensureLoggedIn('/auth/facebook'),
  function (req, res) {
    // TODO: validate input
    var hash = req.params.partyHash;
    var songId = req.params.songId;

    findParty(hash).then(function (party) {
      if (!party) {
        return errorNotFound(res, 'Party not found');
      }

      return sequelize.transaction(function (t) {
        // Lock song to properly increment vote count
        return Song.findOne({
          attributes: ['id'],
          where: {
            id: songId,
            PartyId: party.id
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        }).then(function (song) {
          if (!song) {
            throw new Error('Song not found');
          }
          return song.increment('voteCount', { transaction: t });
        });
      }).then(function (song) {
        return song.reload();
      }).then(function (song) {
        var songData = { id: songId, voteCount: song.voteCount };
        pusher.trigger(hash, 'song-voted', songData);
        return res.status(201).json(songData);
      }).catch(function (err) {
        return errorGeneralError(res, 'Vote could not be cast');
      });
    });
  });

function findParty (hash) {
  return Party.findOne({
    attributes: ['id'],
    where: {
      hash: hash
    }
  });
}

function updateCurrentSongStatus (party, newStatus) {
  return Song.findOne({
    where: {
      PartyId: party.id,
      status: {
        // A song can be updated only if it's already
        // in one of these statuses
        $in: ['playing', 'paused']
      }
    }
  }).then(function (song) {
    if (!song) {
      throw new Error('No song is currently loaded');
    }
    return song.update({ status: newStatus });
  });
}

function advanceSong (party, newSongId) {
  return Song.findOne({
    where: {
      PartyId: party.id,
      id: newSongId,
      // A song can be advanced to only if it's
      // in the "queued" status
      status: Song.Status.QUEUED
    }
  }).then(function (song) {
    if (!song) {
      throw new Error('Cannot advance to song ' + newSongId);
    }
    return song.update({ status: Song.Status.PLAYING });
  });
}

function pageNotFound (res, message) {
  res.status(404).render('error', {
    message: 'Party not found'
  });
}

function errorNotFound (res, message) {
  res.status(404).json({
    error: message
  });
}

function errorGeneralError (res, message) {
  res.status(400).json({
    error: message
  });
}

module.exports = router;
