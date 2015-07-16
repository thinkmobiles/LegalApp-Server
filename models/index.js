'use strict';

var Models = function ( PostGre ) {

    PostGre.plugin('visibility'); //https://github.com/tgriesser/bookshelf/wiki/Plugin:-Visibility
    var Model = PostGre.Model.extend({
        hasTimestamps: true
    });

    //this.User =  require('./users')( PostGre, Model );
};
module.exports = Models;