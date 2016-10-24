'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.renameColumn('songs', 'order', 'voteCount');
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.renameColumn('songs', 'voteCount', 'order');
  }
};
