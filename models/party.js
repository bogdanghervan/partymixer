'use strict';
module.exports = function(sequelize, DataTypes) {
  var Party = sequelize.define('Party', {
    name: DataTypes.STRING,
    userFacebookId: DataTypes.BIGINT,
    currentSongId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Party.hasMany(models.Song);
      }
    },
    tableName: 'parties'
  });
  return Party;
};