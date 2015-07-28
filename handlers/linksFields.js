/**
 * Created by kille on 24.07.2015.
 */
'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');

var LinksFieldsHandler = function (PostGre) {
    var Models = PostGre.Models;
    var LinksFieldsModel = Models.LinksFields;
    var self = this;

    this.prepareSaveData = function (params) {
        var saveData = {};

        if (params && params.link_id) {
            saveData.link_id = params.link_id;
        }
        if (params && params.name) {
            saveData.name = params.name;
        }
        if (params && params.code) {
            saveData.code = params.code;
        }

        return saveData;
    };

    function addField(data, callback) {
        var saveData = self.prepareSaveData(data);

        LinksFieldsModel
            .forge()
            .save(saveData)
            .exec(function (err, linkFieldModel) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, linkFieldModel);
                }
            });
    };

    this.addLinkFields = function (options, callback) {
        var linkFields = options.link_fields;
        var createdModels = [];

        if (!linkFields || !linkFields.length) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: 'links_fields or link_Id'})); //TODO: link_fields
            }
            return;
        }

        async.each(linkFields,
            function (fields, cb) {

                addField(fields, function (err, linkFieldModel) {
                    if (err) {
                        return cb(err);
                    }
                    createdModels.push(linkFieldModel);
                    cb();
                });

            }, function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, createdModels);
                }
            }
        );
    };

    this.createLinksFields = function (req, res, next) {
        /*var linksId = req.body.id;
        var linksFields = req.body.links_fields;
        var saveData;
        var linksmodels = [];

        if (!linksFields ||!linksId) {
            return next(badRequests.NotEnParams({reqParams: 'links_fields or links_Id'}));
        }

        async.each(linksFields,
            function (data, callback) {
                data.link_id = linksId;
                saveData = self.prepareSaveData(data);
                LinksFieldsModel
                    .forge()
                    .save(saveData)
                    .exec(function (err, links) {
                        if (err) {
                            callback(err);
                        }else {
                            linksmodels.push(links);
                            callback();
                        }
                    });
            }, function (err) {
                if (err) {
                    next(err);
                } else {
                    res.status(201).send({success: 'Links created', model: linksmodels});
                }
            }
        );*/

        var options = req.body;

        self.addLinkFields(options, function (err, models) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'Link fields created', models: models});
        });

    };

    this.getLinksFieldsById = function (req, res, next) {
        //var companyId = req.session.companyId;
        var linksFieldsId = req.params.id;

        LinksFieldsModel
            .forge({id: linksFieldsId})
            .fetch({require:true})
            .then(function (linksField) {
                res.status(200).send(linksField);
            })
            .catch(LinksFieldsModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

};

module.exports = LinksFieldsHandler;