/**
 * Represents a party.
 * @param {Object} $container
 * @param {Object} pusher
 * @param {Boolean} isHost
 * @constructor
 */
var Party = function ($container, pusher, isHost) {
  var self = this;
  var partyId = $container.data('party-id');

  this.isHost = isHost;
  this.$container = $container;
  this.player = new Player($('.player', this.$container));
  this.playlist = new Playlist($('.playlist', $container));

  // Init
  var channel = pusher.subscribe(partyId);
  channel.bind('pusher:subscription_succeeded', init);
  channel.bind('song-added', updatePlaylist);
  // channel.bind('song-playing', updateCurrentSong);

  function init() {
    $.get('/parties/' + partyId + '/songs').done(function (songs) {
      // Find current song in either "paused" or "playing"
      // states (it's usually at the beginning)
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

  function updatePlaylist(data) {
    self.playlist.addSong(data);
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
