'use strict';

var CONSTANTS = require('../constants/index');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var TABLES = require('../constants/tables');

var async = require('async');
var badRequests = require('../helpers/badRequests');

var FieldsHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var FieldModel = Models.Field;
    var self = this;

    this.getFields = function (req, res, next) {
        FieldModel
            .forge()
            .fetchAll()
            .exec(function (err, fileModels) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(fileModels);
            });
    };

    this.getField = function (req, res, next) {

    };
};

module.exports = FieldsHandler;