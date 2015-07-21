'use strict';

var Models = function ( PostGre ) {

    PostGre.plugin('visibility'); //https://github.com/tgriesser/bookshelf/wiki/Plugin:-Visibility
    var Model = PostGre.Model.extend({
        hasTimestamps: true,
        getTableName: function () {
            return this.tableName.replace(/s$/, '');
        }
    });

    this.User =  require('./user')( PostGre, Model );
    this.Profile =  require('./profile')( PostGre, Model );
};
module.exports = Models;