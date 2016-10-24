'use strict';
var _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  var Song = sequelize.define('Song', {
    youtubeVideoId: DataTypes.STRING,
    userFacebookId: DataTypes.BIGINT.UNSIGNED,
    name: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('queued', 'playing', 'paused', 'ended'),
      defaultValue: 'queued',
      allowNull: false
    },
    voteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    classMethods: {
      associate: function(models) {
        Song.belongsTo(models.Party);
      },
      Status: {
        QUEUED: 'queued',
        PLAYING: 'playing',
        PAUSED: 'paused',
        ENDED: 'ended'
      },
    },
    instanceMethods: {
      getPublicData: function() {
        return _.pick(this.dataValues,
          ['id', 'youtubeVideoId', 'userFacebookId', 'name', 'status', 'voteCount']);
      }
    },
    tableName: 'songs'
  });
  return Song;
};
