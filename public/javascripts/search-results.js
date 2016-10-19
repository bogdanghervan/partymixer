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
