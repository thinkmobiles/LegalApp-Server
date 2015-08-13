'use strict';

var CONSTANTS = require('../constants/index');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

var async = require('async');
var badRequests = require('../helpers/badRequests');

var DocumentsHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var FieldModel = Models.Field;
    var DocumentModel = Models.Document;
    var TemplateModel = Models.Template;
    var self = this;

    this.newDocument = function (req, res, next) {
        var options = req.body;
        var templateId = options.template_id;
        var values;
        var saveData;
        var companyId = req.session.companyId;

        if (!templateId) {
            return next(badRequests.NotEnParams({reqParams: ['template_id']}));
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        }

        saveData = {
            status: STATUSES.CREATED,
            template_id: templateId
        };

        async.waterfall([

            //try to find the template:
            function (cb) {
                var criteria = {
                    id: templateId
                };
                var fetchOptions = {
                    require: true
                };

                if (values) {
                    fetchOptions.withRelated =  ['link.linkFields'];
                }

                TemplateModel
                    .find(criteria, fetchOptions)
                    .then(function (templateModel) {
                        cb(null, templateModel);
                    })
                    .catch(TemplateModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //insert into documents:
            function (templateModel, cb) {
                var htmlContent;
                var templateHtmlContent = templateModel.get('html_content');
                var linkModel = templateModel.related('link');
                var linkFieldsModels;
                var fields = [];

                if (linkModel && linkModel.related('linkFields')) {
                    linkFieldsModels = linkModel.related('linkFields');
                    linkFieldsModels.models.forEach(function (model) {
                        fields.push(model.toJSON());
                    });
                }

                if (values && templateHtmlContent) {
                    htmlContent = self.createDocument(templateHtmlContent, fields, values);
                } else {
                    htmlContent = 'empty';
                }

                saveData.company_id = templateModel.get('company_id');
                saveData.html_content = htmlContent;

                DocumentModel
                    .upsert(saveData)
                    .exec(function (err, documentModel) {
                        if (err) {
                            return cb(err);
                        }
                        console.log(documentModel);
                        cb(null, documentModel)
                    });
            }

        ], function (err, documentModel) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'success created', model: documentModel});
        });
    };

    this.updateDocument = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));
    };

    this.getDocuments = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));
    };

    this.getDocument = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));
    };

    this.createDocument = function (htmlText, fields, values, callback) {

        //check input params:
        if (!htmlText || !htmlText.length || !fields || !values) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['htmlText', 'fields', 'values']}));
            }
            return false;
        }

        //if (htmlText.length && (Object.keys(fields).length !== 0) && (Object.keys(values).length !== 0)) { //TODO ..

        /*for (var i in values) {
            var val = values[i];
            var code = fields[i];

            htmlText = htmlText.replace(new RegExp(code, 'g'), val); //replace fields in input html by values
        }*/

        fields.forEach(function (field) {
            var fieldName = field.name;
            var searchValue = field.code;
            var replaceValue;

            if (fieldName in values) {
                replaceValue = values[fieldName];
                htmlText = htmlText.replace(new RegExp(searchValue, 'g'), replaceValue); //replace fields in input html by values
            }
        });

        //return result
        if (callback && (typeof callback === 'function')) {
            callback(null, htmlText); //all right
        }
        return htmlText;

    };

};

module.exports = DocumentsHandler;