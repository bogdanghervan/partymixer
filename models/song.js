'use strict';
module.exports = function(sequelize, DataTypes) {
  var Song = sequelize.define('Song', {
    youtubeVideoId: DataTypes.STRING,
    name: DataTypes.STRING
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