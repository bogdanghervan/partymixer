# PartyMixer
Collaboratively edited playlists for your parties.

## TODO

* ~~.env file~~
* ~~Show users currently in the party using a Pusher presence channel for every party~~
* Voting mechanism:
  * ~~API endpoint;~~
  * ~~handle Pusher event in the UI;~~
  * change the order of the songs immediately on the triggerrer (do not wait for Pusher);
  * add the actual button for voting;
  * persist the users who voted for each song, not just the number of votes and show them alongside each song in the queue.
* Add "Search" button on party page
* Implement logout
* Bug: Queue updates to the playlist UI so incoming songs are added in the right order
(and after the playlist is initially populated)
* Check that duplicate *queue* entries don't occur  
* Retrieve messages missed during periods of network instability
* Bug: when the host leaves party, correctly update the guests that nothing is playing
* Recent parties page (so users could find their way back to the party when lost) 
* Show a flash message for newly created parties inviting host to add some songs and how to invite quests
* Subscribe to the party presence channel from the search page
* Make routes less fat
* Handle failure better
* ~~browserify~~

### Nice-to-have*s*

* Monitor Pusher connection state and notify users when disconnected *Gmail*-style
* Show the total duration of the songs that are left in the play queue
* Show how much a user has to wait until their song comes up
* Pagination of YouTube search results (or "Load More")
  * Automatically load more results when all 10 results have been added to the queue
* Collapse extra participants when there are too many to fit on the screen
  * And no longer display the current user if it's the only participant
* Add repeat feature
* Track playback progress to avoid starting from the beginning upon page refresh 
* Suggest some songs to kick off the party after it's created
  * either whatever is popular at the moment or based on the host's past parties (and guests' past parties, as they join)
* Always-working suggest feature (collaborative filtering)
  * maybe use YouTube's related videos search?
* Implement authorization with YouTube (maybe use IonicaBizau/youtube-api?) and allow importing user's existing YouTube playlists 
* Show video's publish date in search results based on its publishedAt property (and translate *2011-12-14T20:48:50.000Z* to *4 years ago* like YouTube does) 
* Maybe use [Isotope](http://isotope.metafizzy.co/) to rearrange users based on their contribution to the party?
