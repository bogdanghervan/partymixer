'use strict';
module.exports = function(sequelize, DataTypes) {
  var Song = sequelize.define('Song', {
    youtubeVideoId: DataTypes.STRING,
    name: DataTypes.STRING,
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
