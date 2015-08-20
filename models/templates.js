'use strict';

var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');
var async = require('async');

module.exports = function (PostGre, ParentModel) {
    var TemplateModel = ParentModel.extend({
        tableName: TABLES.TEMPLATES,
        hidden: ['html_content'/*, 'created_at', 'updated_at'*/],
        initialize: function () {
            this.on('destroying', this.removeDependencies);
        },

        link: function () {
            return this.belongsTo(PostGre.Models.Link);
        },

        company: function () {
            return this.belongsTo(PostGre.Models.Company);
        },

        templateFile: function () {
            return this.morphOne(PostGre.Models.Attachment, 'attacheable');
        },

        documents: function () {
            return this.hasMany(PostGre.Models.Document);
        },

        toJSON: function () {
            var attributes;
            var templateFile;
            var key;
            var name;
            var bucket = BUCKETS.TEMPLATE_FILES;
            var url;

            attributes = ParentModel.prototype.toJSON.call(this);

            if (attributes.id && this.relations && this.relations.templateFile) {
                templateFile = this.relations.templateFile;

                if (templateFile.id && templateFile.attributes.key && templateFile.attributes.name) {
                    name = templateFile.attributes.name;
                    key = templateFile.attributes.key;
                    url = PostGre.Models.Image.uploader.getFileUrl(key, bucket);
                }

                attributes.templateFile = {
                    url: url
                };
            }
            return attributes;
        },

        removeDependencies: function (callback) {
            var templateId;
            var linkId;
            var companyId;

            if (!this || !this.id) {
                return;
            }

            templateId = this.id;
            linkId = this.get('link_id');
            companyId = this.get('company_id');

            async.parallel([

                //remove the links:
                function (cb) {
                    PostGre.Models.Link.removeById(linkId, companyId, cb)
                }

            ], function (err, results) {
                if (err) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error(err);
                    }
                }

                if (callback && (typeof callback === 'function')) {
                    callback(err, results);
                }
            });
        }
    });

    return TemplateModel;
};