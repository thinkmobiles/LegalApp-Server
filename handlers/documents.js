'use strict';

var CONSTANTS = require('../constants/index');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

var async = require('async');
var badRequests = require('../helpers/badRequests');
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');

var DocumentsHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var FieldModel = Models.Field;
    var DocumentModel = Models.Document;
    var TemplateModel = Models.Template;
    var self = this;

    function createDocumentContent (htmlText, fields, values, callback) {

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

    this.newDocument = function (req, res, next) {
        var options = req.body;
        var templateId = options.template_id;
        var values;
        var saveData;
        var companyId = req.session.companyId;

        console.log('create document');
        console.log(options);

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

    this.sendDocumentToSign = function (req, res, next) {
        //next(badRequests.AccessError({message: 'Not implemented yet'}));
        var documentId = req.params.id;


        async.parallel({

            //find the current user:
            currentUser: function (cb) {
                var criteria = {
                    id: req.session.userId
                };
                var fetchOptions = {
                    require: true,
                    withRelated: ['profile']
                };

                UserModel
                    .find(criteria, fetchOptions)
                    .then(function (userModel) {
                        cb(null, userModel);
                    })
                    .catch(DocumentModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //find the document:
            document: function (cb) {
                var criteria = {
                    id: documentId
                };
                var fetchOptions = {
                    require: true,
                    withRelated: ['assignedUser.profile', 'template', 'company']
                };

                DocumentModel
                    .find(criteria, fetchOptions)
                    .then(function (documentModel) {
                        cb(null, documentModel);

                        /*var userId = documentModel.get('assigned_id');
                        var htmlContent;
                        var accessToken = tokenGenerator.generate();

                        if (!userId) {
                            return next(badRequests.InvalidValue({message: 'There is not assigned user'})); //TODO: ...
                        }

                        htmlContent = documentModel.get('html_content');

                        documentModel.set('access_token', accessToken);
                        documentModel
                            .save()
                            .exec(function (err, savedDocument) {
                                cb(null, savedDocument);
                            });*/

                    })
                    .catch(DocumentModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            }
        }, function (err, results) {
            var documentModel;
            var document;
            var srcUser;
            var dstUser;
            var company;
            var template;
            var accessToken;
            var saveData;

            if (err) {
                return next(err);
            }

            if (results.currentUser && results.currentUser.id) {
                srcUser = results.currentUser.toJSON();
            }

            if (results && results.document) {
                documentModel = results.document;
            }

            if (documentModel && documentModel.id) {
                document = results.document.toJSON();
            }

            if (document && document.assignedUser && document.assignedUser.id) {
                dstUser = document.assignedUser;
            }

            if (document && document.company) {
                company = document.company;
            }

            if (document && document.template) {
                template = document.template;
            }

            if (!srcUser || !dstUser || !document) {
                return next(badRequests.NotEnParams({message: 'Something was wrong'}));
            }

            /*console.log(srcUser);
            console.log(dstUser);
            console.log(document);
            console.log(template);
            console.log(company);*/

            accessToken = tokenGenerator.generate();
            documentModel.set('access_token', accessToken);
            saveData = {
                access_token: accessToken,
                status: STATUSES.SENT_TO_SIGNATURE_CLIENT,
                sent_at: new Date()
            };

            documentModel
                .save(saveData, {patch: true})
                .exec(function (err, savedDocument) {
                    var mailerParams;

                    if (err) {
                        return next(err);
                    }

                    mailerParams = {
                        srcUser: srcUser,
                        dstUser: dstUser,
                        company: company,
                        template: template,
                        document: savedDocument.toJSON()
                    };

                    mailer.onSendToSingnature(mailerParams);
                    res.status(200).send(results);
                });
        });
    };

    this.getTheDocumentToSign = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));
    }
};

module.exports = DocumentsHandler;