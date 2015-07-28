'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var PERMISSIONS = require('../constants/permissions');

var async = require('async');
var _ = require('lodash');

var badRequests = require('../helpers/badRequests');

var SessionHandler = require('../handlers/sessions');

var TemplatesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var TemplateModel = Models.Template;
    var session = new SessionHandler(PostGre);
    var self = this;

    function preparaSaveData() {
        var saveData = {};

        if (params && params.name) {
            saveData.name = params.name;
        }
        if (params && params.link_id) {
            saveData.link_id = params.link_id;
        }

        return saveData;
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
        return next(badRequests.InvalidValue({message: 'GET /templates is not implemented yet'}));
    };

    this.getTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'GET /templates/:id is not implemented yet'}));
    };

    this.updateTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'DELETE /templates/:id is not implemented yet'}));
    };

    this.removeTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };
};

module.exports = TemplatesHandler;