'use strict';

var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');
var async = require('async');

module.exports = function (PostGre, ParentModel) {
    var TemplateModel = ParentModel.extend({
        tableName: TABLES.TEMPLATES,
        hidden: ['html_content', 'marketing_content', 'created_at', 'updated_at'],
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

        linkedTemplates: function () {
            return this.belongsToMany(PostGre.Models.Template, 'template_id')
                .through(PostGre.Models.LinkedTemplates, 'template_id', 'linked_id');
        },

        getFullTemplate: function (callback, filter) {

            if (typeof callback !== 'function') {
                throw new Error(typeof callback + ' is not a function')
            }
            var queryStr = 'SELECT array_to_json(array_agg(row_to_json(templ))) ' +
                'FROM (SELECT t.id, t.company_id, t.link_id, t.name, t.description, t.has_linked_template, ' +
                '( ' +
                'SELECT row_to_json(l) ' +
                'FROM ( ' +
                'SELECT l.id, l.name, l.company_id ' +
                'FROM links l  WHERE l.id = t.link_id ' +
                ') l ' +

                ') AS link, ' +
                '( ' +
                'SELECT row_to_json(u) ' +
                'FROM ( ' +
                'SELECT \'http://localhost:8850/uploads/development\' || a.name || a.key AS url ' +
                'FROM attachments a ' +
                'WHERE a.attacheable_id = t.id AND a.attacheable_type = \'templates\' ' +
                ') u ' +
                ') AS \"templateFile\", ' +
                '( ' +
                'SELECT array_to_json(array_agg(row_to_json(lt))) ' +
                'FROM ( ' +
                'SELECT t1.id, t1.company_id, t1.link_id, t1.name, t1.description, t1.has_linked_template ' +
                'FROM linked_templates lt ' +
                'LEFT JOIN templates t1 ON lt.linked_id = t1.id ' +
                'WHERE lt.template_id = t.id ' +

                ') lt ' +
                ') AS \"linkedTemplates\" ' +

                'FROM templates t) AS templ ';

            if (filter) {
                if (filter.id) {
                    queryStr += 'WHERE templ.id = ' + filter.id
                }
            }

             PostGre.knex
                 .raw(queryStr)
                 .then(function (queryResult) {
                     callback(null,  queryResult.rows[0].array_to_json)
                 })
                 .catch(function (err) {
                     callback(err)
                 })
        },

        toJSON: function () {
            var uploader = PostGre.Models.Image.uploader;
            var attributes;
            var templateFile;
            var templateFileName;
            var name = null;
            var key;
            var bucket = BUCKETS.TEMPLATE_FILES;
            var url;

            attributes = ParentModel.prototype.toJSON.call(this);

            if (attributes.id && this.relations && this.relations.templateFile) {
                templateFile = this.relations.templateFile;

                if (templateFile.id && templateFile.attributes.key && templateFile.attributes.name) {
                    name = templateFile.attributes.name;
                    key = templateFile.attributes.key;
                    templateFileName = uploader.computeFileName(name, key);
                    url = PostGre.Models.Image.uploader.getFileUrl(templateFileName, bucket);
                }

                attributes.templateFile = {
                    url: url,
                    name: name
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