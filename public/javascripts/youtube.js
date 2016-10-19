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
