'use strict';

var CONSTANTS = require('../constants/index');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');

var async = require('async');
var badRequests = require('../helpers/badRequests');
var wkhtmltopdf = require('wkhtmltopdf');
var AttachmentsHandler = require('./attachments');
var path = require('path');

var DocumentsHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var FieldModel = Models.Field;
    var DocumentModel = Models.Document;
    var TemplateModel = Models.Template;
    var attachmentsHandler = new AttachmentsHandler(PostGre);
    var self = this;

    function toUnicode(theString) {
        var unicodeString = '';
        for (var i=0; i < theString.length; i++) {
            var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
            while (theUnicode.length < 4) {
                theUnicode = '0' + theUnicode;
            }
            theUnicode = '\\u' + theUnicode;
            unicodeString += theUnicode;
        }
        return unicodeString;
    }

    function createDocumentContent(htmlText, fields, values, callback) {

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
            var searchValue = toUnicode(field.code);
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
                    fetchOptions.withRelated = ['link.linkFields'];
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
                    htmlContent = createDocumentContent(templateHtmlContent, fields, values);
                } else {
                    htmlContent = '';
                }

                saveData.company_id = templateModel.get('company_id');
                saveData.html_content = htmlContent;

                DocumentModel
                    .upsert(saveData)
                    .exec(function (err, documentModel) {
                        if (err) {
                            return cb(err);
                        }
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
        var companyId = req.session.companyId;
        var criteria = {
            company_id: companyId
        };

        DocumentModel
            .forge()
            .query(function (qb) {
                qb.where(criteria);
            })
            .fetchAll()
            .exec(function (err, documentModels) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(documentModels);
            });
    };

    this.getDocument = function (req, res, next) {
        var documentId = req.params.id;
        var companyId = req.session.companyId;
        var criteria = {
            id: documentId,
            company_id: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['template']
        };

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                res.status(200).send(documentModel);
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.previewDocument = function (req, res, next) {
        var documentId = req.params.id;
        var companyId = req.session.companyId;
        var criteria = {
            id: documentId,
            company_id: companyId
        };
        var fetchOptions = {
            require: true
        };

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var html = documentModel.get('html_content');
                res.status(200).send(html);
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);

    };

    this.getDocumentsByTemplates = function (req, res, next) {
        var fields = [
            TABLES.TEMPLATES + '.id',
            TABLES.TEMPLATES + '.name'
        ];

        knex(TABLES.TEMPLATES)
            .innerJoin(TABLES.DOCUMENTS, TABLES.TEMPLATES + '.id', TABLES.DOCUMENTS + '.template_id')
            .select(fields)
            .groupBy(fields)
            .count(TABLES.TEMPLATES + '.id')
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(rows);
            });
    };

    this.getDocumentsByTemplate = function (req, res, next) {
        //next(badRequests.AccessError({message: 'Not implemented yet'}));
        var templateId = req.params.templateId;
        var criteria = {
            id: templateId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['documents']
        };

        TemplateModel
            .find(criteria, fetchOptions)
            .then(function (templateModel) {
                res.status(200).send(templateModel);
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.htmlToPdf = function (req, res, next) {
        var html = '<h1>Test</h1><p>Hello world</p><img src="data:image/png;base64, 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">';
        var name = 'testPdf.pdf';
        var key = attachmentsHandler.computeKey(name);
        var filePath = 'public/uploads/development/pdf/' + key;

        wkhtmltopdf(html, {output: filePath}, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send('Pdf with name ' + key + ' was created');
        });
    };

    this.sendDocumentToSign = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));

        var documentId = req.params.id;
        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true
        };

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var userId = documentModel.get('assigned_id');

                if (!userId) {
                    return next(badRequests.InvalidValue({message: 'There is not assigned user'})); //TODO: ...
                }

                res.status(200).send({success: 'message was sent'});

            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.convertHtmlToPdf = function (options, callback) {
        var html;
        var name = 'document.pdf';
        var key = attachmentsHandler.computeKey(name);
        var filePath = path.join(process.env.AMAZON_S3_BUCKET, BUCKETS.PDF_FILES, key);

        if (!options && !options.html) {
            return callback(badRequests.NotEnParams({required: 'html'}));
        }

        html = options.html;

        wkhtmltopdf(html, {output: filePath}, function (err) {
            if (err) {
                return callback(err);
            }
            callback(null, key);
        });
    };

};

module.exports = DocumentsHandler;