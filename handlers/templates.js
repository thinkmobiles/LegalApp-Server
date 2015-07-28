'use strict';

var TABLES = require('../constants/tables');
var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var PERMISSIONS = require('../constants/permissions');

var async = require('async');
var _ = require('lodash');

var badRequests = require('../helpers/badRequests');

var SessionHandler = require('../handlers/sessions');

var TemplatesHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var TemplateModel = Models.Template;
    var session = new SessionHandler(PostGre);
    var self = this;

    function remove(criteria, callback) {
        knex(TABLES.TEMPLATES)
            .where(criteria)
            .del()
            .exec(function (err, result) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, result);
                }
            });
    };

    this.createTemplate = function (req, res, next) {
        var companyId = req.session.companyId;
        var options = req.body;
        var name = options.name;
        var linkId = options.link_id;
        var saveData;

        if (!name || !linkId) {
            return next(badRequests.NotEnParams({reqParams: ['name', 'link_id']}));
        }

        saveData = {
            name: name,
            link_id: linkId,
            company_id: companyId
        };

        TemplateModel
            .upsert(saveData, function (err, templateModel) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({success: MESSAGES.SUCCESS_CREATED_TEMPLATE, model: templateModel});
            });

    };

    this.getTemplates = function (req, res, next) {
        var companyId = req.session.companyId;

        TemplateModel
            .forge()
            .query(function (qb) {
                qb.where({'company_id': companyId});
            })
            //.fetchAll({withRelated: ['link.linkFields']})
            .fetchAll()
            .exec(function (err, result) {
                var templateModels;

                if (err) {
                    return next(err);
                }

                if (result && result.models) {
                    templateModels = result.models;
                } else {
                    templateModels = [];
                }

                res.status(200).send(templateModels);

            });

    };

    this.getTemplate = function (req, res, next) {
        var companyId = req.session.companyId;
        var templateId = req.params.id;
        var criteria = {
            id: templateId,
            company_id: companyId
        };
        var fetchParams = {
            require: true,
            withRelated: ['link']
        };

        TemplateModel
            .find(criteria, fetchParams)
            .then(function (templateModel) {
                res.status(200).send(templateModel);
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);

    };

    this.updateTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'DELETE /templates/:id is not implemented yet'}));
    };

    this.removeTemplate = function (req, res, next) {
        //return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
        var companyId = req.session.companyId;
        var templateId = req.params.id;

        async.parallel([

            //remove the template:
            function (cb) {
                var criteria = {
                    company_id: companyId,
                    id: templateId
                };

                remove(criteria, cb);
            },

            //remove the links:
            function (cb) {
                cb();
            }

        ], function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'Success removed'});
        });
    };
};

module.exports = TemplatesHandler;