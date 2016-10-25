var Player = require('./player');
var Playlist = require('./playlist');
var Presence = require('./presence');
var SongStatus = require('./song-status');

/**
 * Manages the party and the communication inside it using Pusher.
 * @param {Object} $container
 * @param {Object} pusher
 * @param {boolean} isHost
 * @param {string} hostMemberId
 * @constructor
 */
var Party = function ($container, pusher, isHost, hostMemberId) {
  var self = this;
  self.$container = $container;
  self.isHost = isHost;
  self.hostMemberId = hostMemberId;

  self.partyId = $container.data('party-id');
  self.player = new Player($('.player', self.$container), onPlayerStateChange);
  self.playlist = new Playlist($('.playlist', self.$container));
  self.presence = new Presence($('.presence', self.$container), self.partyId, self.hostMemberId, pusher);

  // Subscribe to party channel and listen for events broadcast by other
  // participants. When page loads, we don't fetch the playlist immediately,
  // but rather after subscribing to the party channel.
  // This is to ensure that no messages are missed between the HTML being sent
  // to the client and the subscription on the client taking place.
  // @see https://support.pusher.com/hc/en-us/articles/212715068-How-do-I-implement-message-event-history-
  var channel = pusher.subscribe(self.partyId);
  channel.bind('pusher:subscription_succeeded', init);
  channel.bind('song-added', handleSongAdd);
  channel.bind('song-status-changed', handleSongPausedOrResumed);
  channel.bind('next-song', handleNextSong);
  channel.bind('song-voted', handleSongVote);

  function init () {
    $.get('/parties/' + self.partyId + '/songs').done(function (songs) {
      // Populate playlist
      self.playlist.addSongs(songs);

      if (self.isHost) {
        var song = self.playlist.front();
        if (!song) {
          return;
        }

        // Play or load current song (depending on the song being in
        // the "playing" status or in the "paused" status, respectively)
        if (song.status == SongStatus.PLAYING
          || song.status == SongStatus.PAUSED) {
          self.player.play(song);
        // This party's just getting started - pick the first queued song
        // and start playing it
        } else if (song.status == SongStatus.QUEUED) {
          updateCurrentSong(song);
        }
      }
    });
  }

  /**
   * Handles Pusher event "song-added".
   * OK to run on event triggerer's side.
   * @param {Object} song
   */
  function handleSongAdd (song) {
    self.playlist.addSong(song);
  }

  /**
   * Handles Pusher event "song-voted".
   * OK to run on event triggerer's side.
   * @param {Object} updatedSong
   */
  function handleSongVote (updatedSong) {
    self.playlist.refresh(updatedSong);
  }

  /**
   * Handles Pusher event "song-status-changed".
   * NOT OK to run on event triggerer's side (would be redundant).
   * @param {Object} song
   */
  function handleSongPausedOrResumed (song) {
    self.playlist.refresh(song);
  }

  /**
   * Handles a new song being played (on the guest's side).
   * NOT OK to run on event triggerer's side (would produce
   * conflicting results).
   * @param {Object} nextSong
   */
  function handleNextSong (nextSong) {
    var firstSong = self.playlist.front();

    // Remove current song from the playlist, but not if that
    // song is the one to be played (which is the case when
    // it's first song every played in the party).
    if (nextSong.id != firstSong.id) {
      self.playlist.pop();
    }

    self.playlist.refresh(nextSong);
  }

  /**
   * Advances party to next song. This means the song that just
   * ended is removed from the playlist, and a new song is played
   * (on the host's side).
   */
  function advanceToNextSong () {
    // Remove current song from the playlist
    self.playlist.pop();

    // Pick next song and play it
    if (self.playlist.size()) {
      var song = self.playlist.front();
      updateCurrentSong(song);
    }
  }

  /**
   * Promotes given song to current song and starts
   * playing it immediately.
   * @param {Object} song
   */
  function updateCurrentSong (song) {
    $.post('/parties/' + self.partyId + '/songs/current', {
      socketId: pusher.connection.socket_id,
      songId: song.id
    }).done(function (currentSong) {
      self.player.play(currentSong);

      // Refresh UI for the song that's now playing
      self.playlist.refresh(currentSong);
    });
  }

  /**
   * Handler that is called upon player changing state
   * (e.g. the party host pauses or resumes playback).
   * @todo use a JavaScript event instead?
   * @param {number} newState
   */
  function onPlayerStateChange (newState) {
    switch (newState) {
      case Player.State.PAUSED:
      case Player.State.PLAYING:
        $.post('/parties/' + self.partyId + '/songs/current', {
          socketId: pusher.connection.socket_id,
          status: stateToSongStatus(newState)
        }, function (currentSong) {
          self.playlist.refresh(currentSong);
        });
        break;
      case Player.State.ENDED:
        advanceToNextSong();
        break;
    }
  }

  /**
   * Helper that maps player state (numeral) to song status.
   * @param {number} state
   * @returns {string}
   */
  function stateToSongStatus (state) {
    switch (state) {
      case Player.State.PLAYING:
        return SongStatus.PLAYING;
      case Player.State.ENDED:
        return SongStatus.ENDED;
      case Player.State.PAUSED:
        return SongStatus.PAUSED;
    }
  }
};

/**
 * Initializes video player for party hosts only
 * (the player is not available to guests).
 */
Party.prototype.initPlayer = function () {
  if (!this.isHost) {
    return;
  }

  this.player.build();
};

module.exports = Party;
