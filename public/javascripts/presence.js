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
  }
};
