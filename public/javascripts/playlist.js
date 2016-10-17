/**
 * Represents a playlist.
 * @param {Object} $container
 * @constructor
 */
var Playlist = function ($container) {
  this.$container = $container;
  this.songs = [];
};

/**
 * Returns the song at the beginning of the play queue.
 * @returns {Object}
 */
Playlist.prototype.front = function () {
  return this.songs.length ? this.songs[0] : null;
};

/**
 * Removes song at the beginning of the play queue.
 */
Playlist.prototype.pop = function () {
  var slice = this.songs.splice(0, 1);
  if (slice.length) {
    var song = slice[0];
    $('[data-song-id=' + song.id + ']').remove();
  }
};

/**
 * Returns the number of songs in the playlist including
 * the one currently being played (or in the "paused" state).
 * @returns {Number}
 */
Playlist.prototype.size = function () {
  return this.songs.length;
};

Playlist.prototype.markAsBeingPlayed = function (targetSong) {
  $.each(this.songs, function (key, song) {
    if (song.id == targetSong.id) {
      song.status = SongStatus.PLAYING;

      $('[data-song-id=' + song.id + '] .playing').show();
    }
  });
};

/**
 * Adds songs en-masse to the playlist by repeatedly
 * calling {@link addSong}.
 * @param {Object[]} songs
 */
Playlist.prototype.addSongs = function (songs) {
  var self = this;

  $.each(songs, function (key, song) {
    self.addSong(song);
  });
};

/**
 * Adds a song to the playlist.
 * @param {Object} song
 */
Playlist.prototype.addSong = function (song) {
  this.songs.push(song);

  var template = $('#song-template').text();

  var $song = $(template);
  $song.find('.song-name').text(song.name);
  $song.find('.voter-picture').attr('src', this.userPictureUrl(song.userFacebookId));
  $song.attr('data-song-id', song.id);
  if (song.status == SongStatus.PLAYING) {
    $song.find('.playing').show();
  }

  this.$container.append($song);
};

/**
 * Helper function that returns a Facebook user's profile picture URL
 * given its ID.
 * @param {String} facebookId
 * @returns {String}
 */
Playlist.prototype.userPictureUrl = function (facebookId) {
  return 'https://graph.facebook.com/' + facebookId + '/picture?type=square';
};
