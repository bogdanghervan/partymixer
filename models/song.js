'use strict';
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
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    classMethods: {
      associate: function(models) {
        Song.belongsTo(models.Party);
      }
    },
    tableName: 'songs'
  });
  return Song;
};
