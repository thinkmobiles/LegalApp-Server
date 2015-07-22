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

var imageUploader = require('../helpers/imageUploader/imageUploader')(uploaderConfig);
var TABLES = require( '../constants/tables' );
var BUCKETS = require( '../constants/buckets' );
var async = require('async');

module.exports = function (PostGre, ParentModel) {
    var ImageModel = ParentModel.extend({
        tableName: TABLES.IMAGES,
        //hidden: ['created_at', 'updated_at'],

        initialize: function () {
            this.on('destroying', this.onDestroying);
        },

        toJSON: function () {
            var attributes;

            attributes = ParentModel.prototype.toJSON.call(this);

            if (attributes.id && attributes.key && attributes.name) {
                attributes['image_url'] = ImageModel.getImageUrl(attributes.name, attributes.key);

                delete attributes.name;
                delete attributes.key;
            }
            return attributes;
        },

        onDestroying: function () {
            var self = this;

            //TODO: remove the file from storage
        }
    }, {
        getImageUrl: function (imageName, key) {
            var bucket;
            var name;

            bucket = BUCKETS.AVATARS;
            name = this.getFileName(imageName, key);

            return imageUploader.getImageUrl(name, bucket);
        },

        getFileName: function (name, key) {
            return key + '_' + name;// + '.png';
        },

        uploader: imageUploader
    });

    return ImageModel;
};