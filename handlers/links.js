/**
 * Created by kille on 24.07.2015.
 */
'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');
var LinkFieldHandler = require('../handlers/linksFields');

var LinksHandler = function (PostGre) {
    var Models = PostGre.Models;
    var LinksModel = Models.Links;
    var linkFieldsHandler = new LinkFieldHandler(PostGre);
    var self = this;

    this.prepareSaveData = function (params) {
        var saveData = {};

        if (params && params.name) {
            saveData.name = params.name;
        }

        if (params && params.company_id) {
            saveData.company_id = params.company_id;
        }

        return saveData;
    };

    this.createLink = function (req, res, next) {
        var options = req.body;

        options.company_id = req.session.companyId;

        async.waterfall([

            //create link:
            function (cb) {
                self.addLink(options, cb)
            },

            //create linkFields
            function (linkModel, cb) {
                options.Id = linkModel.id;
                if (options.link_fields && options.link_fields.length) {
                    linkFieldsHandler.addLinkFields(options, cb)
                } else {
                    cb(null, linkModel);
                }
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'Link created', model: result});

        });
    };

    this.addLink = function (options, callback) {
        var saveData;

        if (!options.name) {
            return callback(badRequests.NotEnParams({reqParams: 'name'}));
        }

        saveData = self.prepareSaveData(options);
        LinksModel
            .forge()
            .save(saveData)
            .exec(function (err, link) {
                callback(err, link);
            });
    };

    /*this.modifyLink = function (linkId, linksaveData, callback) {

     LinksModel
     .forge({id: linkId})
     .save(linksaveData, {patch: true})
     .then(function (linkModel) {
     callback(null, linkModel);
     })
     .catch(LinksModel.NotFoundError, function (err) {
     callback(badRequests.NotFound());
     })
     .catch(function (err) {
     if (err.message && err.message.indexOf('No rows were affected in the update') !== -1) {
     return callback(badRequests.NotFound());
     }
     callback(err);
     });
     };*/

    this.updateLink = function (req, res, next) {
        var options = req.body;
        options.company_id = req.session.companyId;
        var linksaveData = self.prepareSaveData(options);
        var linkId = req.params.id;
        var criteria = {
            id: linkId,
            company_id: options.company_id
        };
        var fetchOptions = {
            require: true,
            withrelated: ['linkFields']
        };

        // === 1 because company_id exists anyway in options (from session)
        if ((Object.keys(linksaveData).length === 1) && !options.link_fields) {
            return next(badRequests.NotEnParams({message: 'Nothing to update'}))
        }

        async.waterfall([

            //try to find link:
            function (cb) {
                LinksModel
                    .find(criteria, fetchOptions)
                    .then(function (linkModel) {
                        cb(null, linkModel);
                    })
                    .catch(LinksModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //update link:
            function (linkModel, cb) {
                linkModel
                    .save(linksaveData, {patch: true})
                    .exec(function (err, resultModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, resultModel);
                    });
            },

            //update linkFields (find and update):
            function (resultModel, cb) {
                linkFieldsHandler.modifyLinkFields(options, function (err, fieldsModels) {
                    if (err) {
                        cb(err, resultModel);
                    } else {
                        resultModel.attributes.link_fields = fieldsModels;
                        cb(null, resultModel);
                    }
                });
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'Link updated', model: result});

        });
    };

    this.getLink = function (req, res, next) {
        var id = req.params.id;
        var companyId = req.session.companyId;
        var criteria = {
            id: id,
            company_id: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['linkFields']
        };

        LinksModel
            .find(criteria, fetchOptions)
            .then(function (link) {
                res.status(200).send(link);
            })
            .catch(LinksModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.getLinks = function (req, res, next) {
        var companyId = req.session.companyId;

        LinksModel
            .forge()
            .where({company_id: companyId})
            .fetchAll({withRelated: ['linkFields']})
            .exec(function (err, result) {
                var linksModels;

                if (err) {
                    return next(err);
                }

                if (result && result.models) {
                    linksModels = result.models;
                } else {
                    linksModels = [];
                }

                res.status(200).send(linksModels);
            });
    };

    this.removeLink = function (req, res, next) {
        var companyId = req.session.companyId;
        var linkid = req.params.id;

        LinksModel
            .removeById(linkid, companyId, function (err) {
                if (err) {
                    next(err);
                } else {
                    res.status(200).send({success: 'Link successfully deleted.'});
                }
            });
    };

};

module.exports = LinksHandler;