# PartyMixer
Collaboratively edited playlists for your parties.

## TODO

* ~~.env file~~
* Show users currently in the party using a Pusher presence channel for every party
* browserify
* Add security middleware
* Implement logout
* Stop playing animation when playback pauses (maybe use rubentd/gifplayer?)
* Make routes less fat
* Handle failure better

### Nice-to-have*s*

* Monitor Pusher connection state and notify users when disconnected *Gmail*-style
* Show the total duration of the songs that are left in the play queue
* Show how much a user has to wait until their song comes up
* Vote songs up (use binary insertion sort to reposition the song in the playlist)
* Pagination of YouTube search results (or "Load More")
  * Automatically load more results when all 10 results have been added to the queue
* Maybe use [Isotope](http://isotope.metafizzy.co/) to rearrange users based on their contribution to the party? 
* Collapse extra participants when there are too many to fit on the screen
* Add ability to repeat already added songs once the end of the playlist is reached
* Suggest some songs to kick off the party after it's created
  * either whatever is popular at the moment or based on the host's past parties (and guests' past parties, as they join)
* Always-working suggest feature (collaborative filtering)
  * maybe use YouTube's related videos search?
* Implement authorization with YouTube (maybe use IonicaBizau/youtube-api?) and allow importing user's existing YouTube playlists 
* Show video's publish date in search results based on its publishedAt property (and translate *2011-12-14T20:48:50.000Z* to *4 years ago* like YouTube does) 
