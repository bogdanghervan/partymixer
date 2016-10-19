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
  // @see https://blog.pusher.com/how-to-add-message-history-to-your-pusher-apps/
  var channel = pusher.subscribe(self.partyId);
  channel.bind('pusher:subscription_succeeded', init);
  channel.bind('song-added', handleSongAdd);
  channel.bind('song-status-changed', handleSongPausedOrResumed);
  channel.bind('next-song', handleNewSong);

  function init () {
    $.get('/parties/' + self.partyId + '/songs').done(function (songs) {
      // Play or load current song (the song can either
      // be in the "playing" status or in the "paused" status)
      if (isHost) {
        $.each(songs, function (key, song) {
          if (song.status == SongStatus.PLAYING
            || song.status == SongStatus.PAUSED) {
            self.player.play(song);
            // Break from the loop
            return false;
          }
        });
      }

      // Load playlist
      self.playlist.addSongs(songs);
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
   * @param {Object} song
   */
  function handleNewSong (song) {
    // Remove current song from the playlist
    self.playlist.pop();

    self.playlist.refresh(song);
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

      $.post('/parties/' + self.partyId + '/songs/current', {
        socketId: pusher.connection.socket_id,
        songId: song.id
      }).done(function (currentSong) {
        self.player.play(currentSong);

        // Refresh UI for the song that's now playing
        self.playlist.refresh(currentSong);
      });
    }
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
