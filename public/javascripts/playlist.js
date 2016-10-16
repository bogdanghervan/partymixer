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
 * Returns the song at the beginning of the play queue,
 * and effectively removes it from the playlist.
 * @returns {Object}
 */
Playlist.prototype.pop = function () {
  var slice = this.songs.splice(0, 1);

  return slice.length ? slice[0] : null;
};

/**
 * Returns the number of songs in the playlist including
 * the one currently being played (or in the "paused" state).
 * @returns {Number}
 */
Playlist.prototype.size = function () {
  return this.songs.length;
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
 * @param data
 */
Playlist.prototype.addSong = function (data) {
  this.songs.push(data);

  var template = $('#song-template').text();

  var $song = $(template);
  $song.find('.song-name').text(data.name);
  $song.find('.voter-picture').attr('src', this.userPictureUrl(data.userFacebookId));
  $song.attr('data-song-id', data.id);

  this.$container.append($song);
};

/**
 * Helper function that returns a Facebook user's profile picture URL
 * given its ID.
 * @param {String} facebookId
 * @returns {string}
 */
Playlist.prototype.userPictureUrl = function (facebookId) {
  return 'https://graph.facebook.com/' + facebookId + '/picture?type=square';
};
