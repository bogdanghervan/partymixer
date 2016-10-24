/**
 * Represents a playlist.
 * @param {Object} $container
 * @constructor
 */
var Playlist = function ($container) {
  this.$container = $container;
  this.$heading = $('.panel-heading', $container);
  this.$list = $('.list-group', $container);

  this.template = $('#song-template').text();
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
    this.updateHeading();
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

/**
 * Finds given song in the playlist and refreshes it (data and UI).
 * @param {Object} updatedSong
 */
Playlist.prototype.refresh = function (updatedSong) {
  var self = this;
  $.each(this.songs, function (key, song) {
    if (song.id == updatedSong.id) {
      var $songEl = $('[data-song-id=' + song.id + ']');

      // Refresh status and UI
      song.status = updatedSong.status;
      $('.animation', $songEl)
        .toggleClass('hidden', song.status != SongStatus.PLAYING);

      // Also refresh sortable hash
      song.sortableHash = self.makeSortableHash(song);
      $songEl.attr('data-sortable-hash', song.sortableHash);

      // Break loop
      return false;
    }
  });
};

/**
 * Updates song count and other playlist information.
 * @todo Add total song duration
 */
Playlist.prototype.updateHeading = function () {
  var songCount = this.songs.length;

  this.$heading.text(songCount + (songCount != 1 ? ' songs' : ' song'));
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
 * Adds a song to the playlist. Noteworthy to mention is songs are added either
 * at page load or whenever a participant enqueues one, in a concurrent fashion.
 * This method ensures that the order of the inserted songs is correct (since a
 * song could be enqueued before the full playlist is fetched from the server).
 *
 * @todo Check that duplicate *queue entries* don't occur for the same reason
 *   as above (this doesn't mean the same song couldn't be added several times
 *   during the party)
 * @see https://support.pusher.com/hc/en-us/articles/212715068-How-do-I-implement-message-event-history-
 * @param {Object} song
 */
Playlist.prototype.addSong = function (song) {
  song.sortableHash = this.makeSortableHash(song);
  this.songs.push(song);

  var $song = $(this.template);
  $song.find('.song-name').text(song.name);
  $song.find('.voter-picture').attr('src', User.pictureUrl(song.userFacebookId));
  $song.attr('data-song-id', song.id);
  $song.attr('data-sortable-hash', song.sortableHash);
  if (song.status == SongStatus.PLAYING) {
    $song.find('.animation').removeClass('hidden');
  }

  this.$list.append($song);
  this.updateHeading();
};

/**
 * Returns a sortable hash for given song. The 7-byte value consists of:
 *   - a 1-byte song status (0 - playing/paused, 1 - queued, 2 - ended)
 *   - a 2-byte vote count (which is <= number of participants - hard limit)
 *   - a 4-byte value representing the second since the Unix epoch
 * The resulting string is lexicographically sortable.
 * This was inspired by MongoDB's ObjectId.
 * @param {Object} song
 */
Playlist.prototype.makeSortableHash = function (song) {
  var hash = '';
  // Sort by song status first
  switch (song.status) {
    // Always display the currently playing/paused song first
    case SongStatus.PLAYING:
    case SongStatus.PAUSED:
      hash += '10';
      break;
    case SongStatus.QUEUED:
      hash += '20';
      break;
    // We shouldn't see much of these yet, but plan ahead
    case SongStatus.ENDED:
      hash += '30';
      break;
  }
  // Then by vote count
  hash += this.lpad((new Number(65535 - song.voteCount)).toString(16), 4, '0');

  // Then by the time the song was queued
  hash += ((new Date(song.queuedAt)).getTime() / 1000 | 0).toString(16);

  return hash;
};

/**
 * Helper that pads a string to a certain length with another string.
 * (String.prototype.padStart is not widely supported)
 * @param {String} input
 * @param {Number} targetLength
 * @param {String} padString
 * @returns {String}
 */
Playlist.prototype.lpad = function (input, targetLength, padString) {
  while (input.length < targetLength) {
    input = padString + input;
  }
  return input;
}
