'use strict';
var uploaderConfig;
var amazonS3conf;

if (process.env.UPLOADER_TYPE === 'AmazonS3') {
    amazonS3conf = require('../config/aws');
    uploaderConfig = {
        type: process.env.UPLOADER_TYPE,
        awsConfig: amazonS3conf
    };
} else {
    uploaderConfig = {
        type: process.env.UPLOADER_TYPE,
        directory: process.env.AMAZON_S3_BUCKET
    };
}

var uploader = require('../helpers/imageUploader/imageUploader')(uploaderConfig);
var Models = function ( PostGre ) {

    PostGre.plugin('visibility'); //https://github.com/tgriesser/bookshelf/wiki/Plugin:-Visibility
    var Model = PostGre.Model.extend({
        hasTimestamps: true
        //getTableName: function () {
        //    return this.tableName.replace(/s$/, '');
        //}
    }, {
        find: function (forgeOptions, fetchOptions) {
            return this
                .forge(forgeOptions)
                .fetch(fetchOptions);
        },
        findAll: function (forgeOptions, fetchOptions) {
            return this
                .forge(forgeOptions)
                .fetchAll(fetchOptions);
        },
        upsert: function (data, callback) {
            if (data && data.id) {
                //update:
                return this.forge({id: data.id}).save(data, {patch: true}).exec(callback);
            } else {
                //insert:
                return this.forge().save(data).exec(callback);
            }
        }
    });

    this.Attachment =  require('./attachments')( PostGre, Model );
    this.Company =  require('./company')( PostGre, Model );
    this.Document =  require('./documents')( PostGre, Model );
    this.Employee =  require('./employee')( PostGre, Model );
    this.Image =  require('./images')( PostGre, Model );
    this.User =  require('./user')( PostGre, Model );
    this.Profile =  require('./profile')( PostGre, Model );
    this.Link =  require('./links')( PostGre, Model );
    this.Links =  require('./links')( PostGre, Model ); //TODO: remove Links and use Link
    this.LinkFields =  require('./linksFields')( PostGre, Model );
    this.LinksFields =  require('./linksFields')( PostGre, Model ); //TODO: remove LinksFields and use Link
    this.Template =  require('./templates')( PostGre, Model );
    this.Message =  require('./message')( PostGre, Model );
    this.SecretKey =  require('./secretKey')( PostGre, Model );
    this.LinkedTemplates =  require('./linkedTemplates')( PostGre, Model );

    this.uploader = uploader;
};
module.exports = Models;