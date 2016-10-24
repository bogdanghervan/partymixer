'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('songs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      youtubeVideoId: {
        type: Sequelize.STRING
      },
      userFacebookId: {
        type: Sequelize.BIGINT.UNSIGNED
      },
      name: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('queued', 'playing', 'paused', 'ended'),
        defaultValue: 'queued',
        allowNull: false
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('songs');
  }
};
