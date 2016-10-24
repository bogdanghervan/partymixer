(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.App = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Exports modules from bundle for public consumption as seen here:
 */
exports.Party = require('./party');
exports.Youtube = require('./youtube');
exports.Search = require('./search');

},{"./party":2,"./search":7,"./youtube":10}],2:[function(require,module,exports){
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

},{"./player":3,"./playlist":4,"./presence":5,"./song-status":8}],3:[function(require,module,exports){
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

},{"./song-status":8}],4:[function(require,module,exports){
var SongStatus = require('./song-status');
var User = require('./user');

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
};

module.exports = Playlist;

},{"./song-status":8,"./user":9}],5:[function(require,module,exports){
var User = require('./user');

/**
 * Manages section showing live party participants.
 * @param {Object} $container
 * @param {string} partyId
 * @param {string} hostMemberId
 * @param {Object} pusher
 * @constructor
 */
var Presence = function ($container, partyId, hostMemberId, pusher) {
  var self = this;
  self.$container = $container;
  self.partyId = partyId;
  self.hostMemberId = hostMemberId;
  self.template = $('#member-template').text();

  // Pusher presence channels help us keep track who's online in realtime
  // Hereunder we're sending our identification while also subscribing
  // to live presence data.
  var presenceChannel = pusher.subscribe('presence-' + partyId);
  presenceChannel.bind('pusher:subscription_succeeded', refreshPresence);
  presenceChannel.bind('pusher:member_added', handleMemberJoining);
  presenceChannel.bind('pusher:member_removed', handleMemberLeaving);

  /**
   * Populates the list of members at once.
   * @param {Object[]} members
   */
  function refreshPresence (members) {
    members.each(function (member) {
      addMember(member);
    });
  }

  /**
   * Handles a new member joining. A user could have multiple connections
   * to the same channel, but this handler will only be triggered once.
   * @param {Object} member
   */
  function handleMemberJoining (member) {
    addMember(member);
  }

  /**
   * Handles a member leaving. A user could have multiple connections
   * to the same channel, but this handler will only be triggered once.
   * @param {Object} member
   */
  function handleMemberLeaving (member) {
    $('[data-id=' + member.id + ']').hide('fast').remove();
  }

  /**
   * Adds a member to the list.
   * @param {Object} member
   */
  function addMember (member) {
    var $memberEl = $(self.template);
    $memberEl.attr('data-id', member.id);

    var $img = $('img', $memberEl);
    $img.attr('src', User.pictureUrl(member.id));
    $img.attr('title', member.info.name);
    if (member.id == hostMemberId) {
      $img.addClass('host');
    }

    $container.append($memberEl);
    $('[data-id=' + member.id + '] img', $container).tooltip();
  }
};

module.exports = Presence;

},{"./user":9}],6:[function(require,module,exports){
/**
 * Controls the search results section.
 * @param {Object} $container
 * @constructor
 */
var SearchResults = function ($container, partyId) {
  var self = this;

  self.$container = $container;
  self.$summary = $('.summary', $container);
  self.$list = $('.list', $container);
  self.partyId = partyId;
  self.results = [];

  self.resultTemplate = $('#result-template').text();
  self.emptyTemplate = $('#empty-template').text();

  var messages = [
      'Sweet!',
      'Song added.',
      'Cool!',
      'Awesome!',
      'Good pick!',
      'Love it!',
      'Roger that.'
  ];

  // Handle "Add to Queue" button now and for future elements
  $(document).on('click', '.btn-enqueue', function () {
    var resultId = $(this).parents('.media').data('index');

    enqueue(resultId);
  });

  /**
   * Adds YouTube video result to party queue.
   * @param {number} resultId
   */
  function enqueue (resultId) {
    var result = self.results.items[resultId];
    if (!result) {
      return;
    }

    $.post('/parties/' + self.partyId + '/songs', {
      youtubeVideoId: result.id.videoId,
      name: result.snippet.title
    }).done(function () {
      enqueueSuccessHandler(resultId);
    }).error(function () {
      enqueueErrorHandler(resultId);
    });
  }

  /**
   * Handles successful queueing of a video result.
   * @param {number} resultId
   */
  function enqueueSuccessHandler (resultId) {
    var $result = $('[data-index=' + resultId + ']');

    $('.overlay-default', $result).remove();

    var $successOverlay = $('.overlay-success', $result);
    $('.message', $successOverlay).text(getRandomMessage());
    $successOverlay.removeClass('hidden');

    setTimeout(function() {
      // TODO: make this nicer (maybe jQuery UI's "clip" effect?)
      $result.hide('fast');
    }, 2000);
  }

  /**
   * Handles failure in queueing video results.
   * @todo Allow nicer recovery from error in the future
   * @param {number} resultId
   */
  function enqueueErrorHandler (resultId) {
    var $result = $('[data-index=' + resultId + ']');
    $('.overlay-default', $result).remove();
    $('.overlay-danger', $result).removeClass('hidden');
  }

  /**
   * Helper that returns a random happy success message.
   * @returns {string}
   */
  function getRandomMessage () {
    var random = Math.floor(Math.random() * messages.length);
    return messages[random];
  }
};

/**
 * Clears search results.
 */
SearchResults.prototype.clear = function () {
  this.$summary.empty();
  this.$list.empty();
  this.results = [];
};

/**
 * Displays new search results.
 * @param {Object} response
 */
SearchResults.prototype.load = function (query, response) {
  var self = this;

  // Clear internal storage and DOM
  self.clear();

  // Update internal storage
  self.results = response;

  // Update DOM
  self.updateSummary(response.pageInfo);
  if (response.items.length) {
    $.each(response.items, function (key, data) {
      self.addResult(key, data);
    });
  } else {
    self.showEmptyResults(query);
  }
};

/**
 * Updates search summary.
 * @param {Object} info
 */
SearchResults.prototype.updateSummary = function (info) {
  var resultCount = Math.min(info.resultsPerPage, info.totalResults);

  if (resultCount) {
    this.$summary.text('Showing top ' + resultCount + ' results');
  } else {
    this.$summary.empty();
  }
};

/**
 * Adds a line item to the search results.
 * @param {Object} data
 */
SearchResults.prototype.addResult = function (index, data) {
  var $result = $(this.resultTemplate);

  $result.find('.media-object')
    .attr('src', data.snippet.thumbnails.default.url)
    .attr('alt', data.snippet.title);
  $result.find('.media-heading').text(data.snippet.title);
  $result.find('.channel').text(data.snippet.channelTitle);
  $result.find('.description').text(data.snippet.description);
  $result.attr('data-index', index);

  this.$list.append($result);
};

/**
 * Displays a notice that no results were found.
 * @param {string} query
 */
SearchResults.prototype.showEmptyResults = function (query) {
  var $emptyEl = $(this.emptyTemplate);

  $emptyEl.find('.query').text(query);

  this.$list.append($emptyEl);
};

module.exports = SearchResults;

},{}],7:[function(require,module,exports){
var SearchResults = require('./search-results');

/**
 * Handles video search.
 * @param {Object} $container
 * @param {Object} youtube
 * @listens event:youtube:loaded
 * @constructor
 */
var Search = function ($container, youtube) {
  var self = this;
  var partyId = $container.data('party-id');

  self.youtube = youtube;
  self.isReady = false;
  self.$container = $container;
  self.$form = $('form', $container);
  self.results = new SearchResults($('.results', $container), partyId);

  $(document).on('youtube:loaded', function () {
    self.isReady = true;
  });

  // Set up search form submission handling
  self.$form.submit(searchRequestSubmit);
  $('button', self.$form).click(searchRequestSubmit);

  // Handles search form submission
  function searchRequestSubmit () {
    var query = $('.query', self.$form).val();

    youtube.search(query, function (response) {
      self.results.load(query, response);
    });

    return false;
  }
};

module.exports = Search;

},{"./search-results":6}],8:[function(require,module,exports){
var SongStatus = {
  QUEUED: 'queued',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ENDED: 'ended'
};

module.exports = SongStatus;

},{}],9:[function(require,module,exports){
var User = {
  /**
   * Helper function that returns a user's profile picture URL
   * given its ID.
   * @param {string} facebookId
   * @returns {string}
   */
  pictureUrl: function (facebookId) {
    return 'https://graph.facebook.com/' + facebookId + '/picture?type=square';
  }
};

module.exports = User;

},{}],10:[function(require,module,exports){
/**
 * YouTube Data API v3 wrapper.
 * @param {string} key
 * @constructor
 */
var Youtube = function (key) {
  this.key = key;
};

/**
 * Loads the client interfaces for the YouTube Analytics and Data APIs,
 * which are required to use the Google APIs JS client and triggers
 * a "youtube:loaded" (using jQuery) to notify interested parties.
 * @fires Youtube#youtube:loaded
 */
Youtube.prototype.init = function () {
  gapi.client.load('youtube', 'v3', function() {
    $(document).trigger('youtube:loaded');
  });

};

/**
 * Callback function called upon completing a search.
 * @callback searchCallback
 * @param {Object} response
 */

/**
 * Searches videos for given query.
 * @param {string} query
 * @param {searchCallback} callback
 */
Youtube.prototype.search = function (query, callback) {
  var request = gapi.client.youtube.search.list({
    key: this.key,
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    prettyPrint: 'false',
    part: 'snippet',
    maxResults: 10
  });

  request.execute(function (response) {
    callback(response.result);
  });
};

module.exports = Youtube;

},{}]},{},[1])(1)
});