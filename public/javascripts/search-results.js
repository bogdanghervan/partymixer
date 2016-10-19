/**
 * Controls the search results section.
 * @param {Object} $container
 * @constructor
 */
var SearchResults = function ($container) {
  this.$container = $container;
  this.$summary = $('.summary', $container);
  this.$list = $('.list', $container);

  this.resultTemplate = $('#result-template').text();
  this.emptyTemplate = $('#empty-template').text();
};

/**
 * Clears search results.
 */
SearchResults.prototype.clear = function () {
  this.$summary.empty();
  this.$list.empty();
};

/**
 * Displays new search results.
 * @param {Object} response
 */
SearchResults.prototype.load = function (query, response) {
  var self = this;

  self.clear();
  self.updateSummary(response.pageInfo);
  if (response.items.length) {
    $.each(response.items, function (key, data) {
      self.addResult(data);
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
SearchResults.prototype.addResult = function (data) {
  var $result = $(this.resultTemplate);

  $result.find('.media-object')
    .attr('src', data.snippet.thumbnails.default.url)
    .attr('alt', data.snippet.title);
  $result.find('.media-heading').text(data.snippet.title);
  $result.find('.channel').text(data.snippet.channelTitle);
  $result.find('.description').text(data.snippet.description);
  $result.attr('data-video-id', data.id.videoId);

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
