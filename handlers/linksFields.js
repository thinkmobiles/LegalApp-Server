/**
 * Created by kille on 24.07.2015.
 */
'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');

var LinksFieldsHandler = function (PostGre) {
    var Models = PostGre.Models;
    var LinkFieldsModel = Models.LinkFields;
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
        if (params && params.type) {
            saveData.type = params.type
        }

        return saveData;
    };

    function modifyField(data, callback) {
        var saveData = self.prepareSaveData(data);
        var criteria = {id: data.id};
        var fetchCriteria = {require: true};


        async.waterfall([

            //try to find field:
            function (cb) {
                LinkFieldsModel
                    .find(criteria, fetchCriteria)
                    .then(function (fieldModel) {
                        cb(null, fieldModel);
                    })
                    .catch(LinkFieldsModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //update field:
            function (fieldModel, cb) {
                fieldModel
                    .save(saveData, {patch: true})
                    .exec(function (err, resultfieldModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, resultfieldModel);
                    });
            }

        ], function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    };

    function addField(data, callback) {
        var name;
        var code;
        var type;
        var saveData; // = self.prepareSaveData(data);

        if (!data) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['data']}));
            }
            return false;
        }

        name = data.name;
        code = data.code;
        type = data.type;

        if (!name || !code || !type) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['name', 'code', 'type']}));
            }
            return false;
        }

        saveData = {
            name: name,
            code: code,
            type: type
        };

        LinkFieldsModel
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
                callback(badRequests.NotEnParams({reqParams: 'link_fields'})); //TODO: link_fields
            }
            return;
        }

        async.each(linkFields,
            function (fields, cb) {
                fields.link_id = options.Id;
                addField(fields, function (err, linkFieldModel) {
                    if (err) {
                        return cb(err);
                    }
                    createdModels.push(linkFieldModel);
                    cb();
                });

            }, function (err) {
                if (callback && (typeof callback === 'function')) {
                    options.link_fields = createdModels;
                    callback(err, options);
                }
            }
        );
    };

    this.modifyLinkFields = function (options, callback) {
        var linkFields = options.link_fields;
        var updatedModels = [];

        if (!linkFields || !linkFields.length) {
            if (callback && (typeof callback === 'function')) {
                callback(null, updatedModels);
            }
            return;
        }

        async.each(linkFields,
            function (fields, cb) {
                modifyField(fields, function (err, linkFieldModel) {
                    if (err) {
                        return cb(err);
                    }
                    updatedModels.push(linkFieldModel);
                    cb();
                });

            }, function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, updatedModels);
                }
            }
        );
    };

    this.createLinkFields = function (req, res, next) {
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
        var linkFieldsId = req.params.id;

        LinkFieldsModel
            .forge({id: linkFieldsId})
            .fetch({require: true})
            .then(function (linkField) {
                res.status(200).send(linkField);
            })
            .catch(LinkFieldsModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

};

module.exports = LinksFieldsHandler;