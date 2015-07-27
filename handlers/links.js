/**
 * Created by kille on 24.07.2015.
 */
'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');

var LinksHandler = function (PostGre) {
    var Models = PostGre.Models;
    var LinksModel = Models.Links;
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
        var saveData;

        if (!options.name) {
            return next(badRequests.NotEnParams({reqParams: 'name'}));
        }

        saveData = self.prepareSaveData(options);
        LinksModel
            .forge()
            .save(saveData)
            .exec(function (err, link) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({success: 'Link created', model: link});
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
        //var companyId = req.session.companyId;
        var companyId = 5543;

        LinksModel
            .forge()
            .where({company_id: companyId})
            .fetchAll({require: true, withRelated: ['linkFields']})
            .then(function (links) {
                res.status(200).send(links);
            })
            .catch(next);
    };

    this.removeLink = function (req, res, next) {
        var companyId = req.session.companyId;
        var linkid = req.params.id;

        LinksModel
            .removeById(linkid,companyId, function(err){
                if (err){
                    next(err);
                } else{
                    res.status(200).send({success: 'Link successfully deleted.'});
                }
            });
    };

};

module.exports = LinksHandler;