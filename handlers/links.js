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

    this.updateLink = function (req, res, next) {
        var id = req.params.id;
        var options = req.body;
        var saveData = self.prepareSaveData(options);

        if (!Object.keys(saveData).length) {
            return next(badRequests.NotEnParams({message: 'Nothing to modify'}))
        }

        LinksModel
            .forge({id: id})
            .save(saveData, {patch: true})
            .then(function (linkModel) {
                res.status(200).send({success: 'Link updated', model: linkModel});
            })
            .catch(LinksModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(function (err) {
                if (err.message && err.message.indexOf('No rows were affected in the update') !== -1) {
                    return next(badRequests.NotFound());
                }
                next(err);
            });
    };

    this.getLink = function (req, res, next) {
        var id = req.params.id;

        LinksModel
            .forge({id: id})
            .fetch({require: true, withRelated: ['linkFields']})
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
        //var companyId = 5543;

        LinksModel
            .forge()
            .where({company_id: companyId})
            .fetchAll({require: true, withRelated: ['linkFields']})
            .then(function (links) {
                if (links && Array.isArray(links.models) && links.models.length) {
                    res.status(200).send(links.models);
                } else {
                    res.status(200).send([]);
                }
            })
            .catch(LinksModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
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