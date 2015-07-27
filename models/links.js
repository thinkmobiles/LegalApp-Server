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
    var removeLinkField = function (linkId, companyId, callback) {
        knex(TABLES.LINKS_FIELDS)
            .innerJoin(TABLES.LINKS, TABLES.LINKS+'.id', TABLES.LINKS_FIELDS+'.link_id')
            .where({
                link_id: linkId,
                company_id: companyId
            })
            .del()
            .exec(function (err, result) {
                if (callback && typeof (callback) === 'function') {
                    callback(err, result);
                }
            })
    };

    var LinksModel = ParentModel.extend({
        tableName: TABLES.LINKS,

        linkFields: function () {
            return this.hasMany(PostGre.Models.LinksFields);
        }

    }, {
        removeById: function (linkId, companyId, callback) {

            async.waterfall([
                    function (cb) {
                        removeLinkField(linkId, companyId, cb);
                    },
                    function (result, cb) {
                        removeLink(linkId, companyId, cb);
                    }],
                function (err, result) {
                    if (callback && typeof (callback) === 'function') {
                        callback(err, result);
                    }
                })
        }
    });

    return LinksModel;
};