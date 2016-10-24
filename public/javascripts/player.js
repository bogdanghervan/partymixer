var SongStatus = require('./song-status');

/**
 * Represents a player.
 * @param {Object} $container
 * @constructor
 */
var Player = function($container, onStateChangeClbk) {
  this.$container = $container;
  this.isBuilt = false;
  this.playerInstance = null;
  this.queuedSong = null;
  this.onStateChangeClbk = onStateChangeClbk;
};

/**
 * This list represents the possible states of the YouTube player.
 * This list is different than the list of possible song states
 * {@link SongState}.
 */
Player.State = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

/**
 * Plays given song. The song may be queued
 * internally until the player is ready.
 * @param {Object} song
 */
Player.prototype.play = function (song) {
  if (this.isBuilt) {
    this.load(song);
  } else {
    this.queuedSong = song;
  }
};

/**
 * Loads the song into the player and either plays it
 * immediately if the song is in the "playing" state,
 * or prepares the player by loading the thumbnail
 * (without actually downloading the song).
 * @todo Add ability to resume video from where it was
 * paused after refreshing the page.
 * @param {Object} song
 */
Player.prototype.load = function (song) {
  if (song.status == SongStatus.PLAYING) {
    this.playerInstance.loadVideoById(song.youtubeVideoId);
  } else if (song.status == SongStatus.PAUSED) {
    this.playerInstance.cueVideoById(song.youtubeVideoId);
  }
};

/**
 * Builds the player and assign event handlers.
 * The moment a YouTube player could be built is signaled
 * by the IFrame API by calling a global function called
 * "onYouTubeIframeAPIReady" which is a good place to be
 * calling this method from.
 */
Player.prototype.build = function () {
  var self = this;
  if (self.isBuilt) {
    return;
  }

  var $canvas = $('.video-canvas', this.$container);

  self.playerInstance = new YT.Player($canvas.get(0), {
    width: '100%',
    height: 390,
    playerVars: {
      autoplay: 1,
      modestbranding: true
    },
    events: {
      onReady: function (event) {
        self.isBuilt = true;

        if (self.queuedSong) {
          self.load(self.queuedSong);
          self.queuedSong = null;
        }
      },
      onStateChange: function (event) {
        if ($.isFunction(self.onStateChangeClbk)) {
          self.onStateChangeClbk(event.data);
        }
      }
    }
  });
};

module.exports = Player;
