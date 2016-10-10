var express = require('express');
var router = express.Router();

/**
 * GET new party page
 *
 * TODO: list current and past parties created by current user
 */
router.get('/',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    res.render('parties/index');
  });

/* POST new party */
router.post('/',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    res.send('respond with a resource');
  });

/* GET party profile page */
router.get('/:partyId',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    res.json(req.params);
  });

/* GET party playlist */
router.get('/:partyId/songs',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    res.send('respond with a resource');
  });

/* POST song to party playlist */
router.post('/:partyId/songs',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    res.send('respond with a resource');
  });

module.exports = router;
