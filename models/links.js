'use strict';

/**
 * Created by kille on 24.07.2015.
 */

var TABLES = require('../constants/tables');
var async = require('async');

module.exports = function (PostGre, ParentModel) {
    var knex = PostGre.knex;
    var removeLink = function (linkId, companyId, callback) {
        knex(TABLES.LINKS)
            .where({
                id: linkId,
                company_id: companyId
            })
            .del()
            .exec(function (err, result) {
                if (callback && typeof (callback) === 'function') {
                    callback(err, result);
                }
            })
    };
    var removeLinkFields = function (linkId, companyId, callback) {
        var subquery = knex.select('id')
            .from(TABLES.LINKS)
            .where({
                id: linkId,
                company_id: companyId
            });

        knex(TABLES.LINKS_FIELDS)
            .whereIn('link_id', subquery)
            .del()
            .exec(function (err, result) {
                if (callback && typeof (callback) === 'function') {
                    callback(err, result);
                }
            });
    };

    var LinksModel = ParentModel.extend({
        tableName: TABLES.LINKS,
        hidden: ['created_at', 'updated_at'],

        linkFields: function () {
            return this.hasMany(PostGre.Models.LinksFields);
        }

    }, {
        removeById: function (linkId, companyId, callback) {

            async.waterfall([
                    function (cb) {
                        removeLinkFields(linkId, companyId, cb);
                    },
                    function (result, cb) {
                        removeLink(linkId, companyId, cb);
                    }],
                function (err, result) {
                    if (callback && typeof (callback) === 'function') {
                        callback(err, result);
                    }
                });
        }
    });

    return LinksModel;
};