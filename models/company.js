'use strict';

var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');
var CONSTANTS = require('../constants/index');

module.exports = function (PostGre, ParentModel) {
    var CompanyModel = ParentModel.extend({
        tableName: TABLES.COMPANIES,
        //hidden: ['created_at', 'updated_at'],
        
        owner: function () {
            return this.belongsTo(PostGre.Models.User);
        },

        logo: function() {
            return this.morphOne(PostGre.Models.Image, 'imageable');
        },

        toJSON: function () {
            var attributes;
            var logo;
            var logoKey;
            var logoName;
            var bucket = BUCKETS.LOGOS;
            var imageUrl;

            attributes = ParentModel.prototype.toJSON.call(this);

            if (attributes.id && this.relations && this.relations.logo) {
                logo = this.relations.logo;

                if (logo.id && logo.attributes.key && logo.attributes.name) {
                    logoName = logo.attributes.name;
                    logoKey = logo.attributes.key;
                    imageUrl = PostGre.Models.Image.getImageUrl(logoName, logoKey, bucket);
                } else {
                    imageUrl = PostGre.Models.Image.uploader.getFileUrl(CONSTANTS.DEFAULT_LOGO_URL, bucket);
                }

                attributes.logo = {
                    url: imageUrl
                };
            }
            return attributes;
        }
    });
    
    return CompanyModel;
};