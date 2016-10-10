var Party = function ($container, pusher) {
  var partyId = $container.data('party-id');
  var $playlist = $('.playlist', $container);

  function addSong(data) {
    var template = $('#song-template').text();

    var $song = $(template);
    $song.find('.song-name').text(data.name);
    $song.attr('data-song-id', data.id);

    $playlist.prepend($song);
  }

  function retrievePlaylist() {
    $.get('/parties/' + partyId + '/songs').done(function(response) {
      $.each(response.rows, function (key, data) {
        addSong(data);
      });
    });
  }

  // Init
  var channel = pusher.subscribe(partyId);
  channel.bind('pusher:subscription_succeeded', retrievePlaylist);

  return {

  };
};