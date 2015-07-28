'use strict';

var TABLES = require('../constants/tables');
var async = require('async');

module.exports = function (PostGre, ParentModel) {
    var TemplateModel = ParentModel.extend({
        tableName: TABLES.TEMPLATES,
        hidden: ['created_at', 'updated_at'],
        initialize: function () {
            this.on('destroying', this.removeDependencies);
        },

        link: function () {
            return this.belongsTo(PostGre.Models.Link);
        },

        company: function () {
            return this.belongsTo(PostGre.Models.Company);
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