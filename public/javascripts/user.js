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
