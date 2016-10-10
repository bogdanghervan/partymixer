'use strict';
module.exports = function(sequelize, DataTypes) {
  var Party = sequelize.define('Party', {
    hash: {
      type: DataTypes.STRING,
      unique: true
    },
    userFacebookId: DataTypes.BIGINT,
    name: DataTypes.STRING,
    currentSongId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Party.hasMany(models.Song);
      },
      generateHash: function() {
        var hash = require('crypto').randomBytes(12).toString('hex');
        return hash;
      }
    },
    tableName: 'parties'
  });
  return Party;
};