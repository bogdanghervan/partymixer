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
  self.results = new SearchResults($('.results', $container));

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
