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
    var TemplatesModel = Models.Template;
    var session = new SessionHandler(PostGre);
    var self = this;

    this.createTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };

    this.getTemplates = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };

    this.getTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };

    this.updateTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };

    this.removeTemplate = function (req, res, next) {
        return next(badRequests.InvalidValue({message: 'This method is not implemented yet'}));
    };
};

module.exports = TemplatesHandler;