'use strict';


var CONSTANTS = require('../constants/index');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var MESSAGES = require('../constants/messages');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');
var SIGN_AUTHORITY = require('../constants/signAuthority');

var async = require('async');
var _ = require('lodash');
var badRequests = require('../helpers/badRequests');
var dSignature = require('../helpers/dSignature');
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');
var checkRunningTime = require('../helpers/checkRunningTime');
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
    var ProfileModel = Models.Profile;
    var LinkFieldsModel = Models.LinkFields;
    var SecretKeyModel = Models.SecretKey;
    var attachmentsHandler = new AttachmentsHandler(PostGre);
    var self = this;

    function toUnicode(theString) {
        var unicodeString = '';
        for (var i = 0; i < theString.length; i++) {
            var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
            while (theUnicode.length < 4) {
                theUnicode = '0' + theUnicode;
            }
            theUnicode = '\\u' + theUnicode;
            unicodeString += theUnicode;
        }

        return unicodeString;
    }

    function saveHtmlToPdf(options, callback) {
        var documentId = options.documentId;
        var name = CONSTANTS.DEFAULT_DOCUMENT_NAME + '_' + documentId + '.pdf';
        var key = attachmentsHandler.computeKey();
        var fileName = key + '_' + name;
        var filePath = path.join(process.env.AMAZON_S3_BUCKET, BUCKETS.PDF_FILES, fileName);
        var result = {
            name: name,
            key: key
        };
        var html = options.html;

        if (process.env.NODE_ENV !== 'production') {
            console.log('--- create pdf file ------------------------');
            console.log('>>> name', name);
            console.log('>>> key', key);
            console.log('>>> filePath', filePath);
            console.log('--------------------------------------------');
        }

        /*if (!options && !options.html) {
            return callback(badRequests.NotEnParams({required: 'html'}));
        }
        html = options.html;*/

        wkhtmltopdf(html, {output: filePath}, function (err) {

            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    }

    function addImageSign(documentModel, userId, signImage, callback) {
        var htmlContent = documentModel.get('html_content');
        var status = documentModel.get('status');
        var clientSignature = '{client_signature}';
        var companySignature = '{company_signature}';
        var replaceValue = '<img src=' + signImage + '>';
        var searchValue;
        var newStatus;
        var saveData;
        var secretKey;
        var options = {};

        if (status === STATUSES.SENT_TO_SIGNATURE_COMPANY) {
            searchValue = companySignature;
            newStatus = STATUSES.SENT_TO_SIGNATURE_CLIENT;
        } else if (status === STATUSES.SENT_TO_SIGNATURE_CLIENT) {
            searchValue = clientSignature;
            newStatus = STATUSES.SIGNED_BY_CLIENT;
        } else {
            return callback(badRequests.AccessError()); //never enter this code (need some fix)
        }

        //save changes to document
        htmlContent = htmlContent.replace(new RegExp(searchValue, 'g'), replaceValue);
        saveData = {
            status: newStatus,
            html_content: htmlContent,
            signed_at: new Date(),
            access_token: tokenGenerator.generate()
        };

        documentModel
            .save(saveData, {patch: true})
            .exec(function (err, savedDocumentModel) {
                if (err) {
                    return callback(err);
                }

                //need create PDF or not
                if (newStatus === STATUSES.SIGNED_BY_CLIENT) {
                    options.html = htmlContent;


                    async.waterfall([

                            //find secretKey of our user
                            function (cb) {
                                SecretKeyModel
                                    .find({user_id: userId}, {require: true})
                                    .then(function (secretKeyModel) {
                                        secretKey = secretKeyModel.get('secret_key');
                                        cb(null, secretKey);
                                    })
                                    .catch(SecretKeyModel.NotFoundError, function (err) {
                                        cb(badRequests.NotFound());
                                    })
                                    .catch(cb);
                            },

                            //create PDF and save secretKey to PDF
                            function (secretKey, cb) {
                                saveHtmlToPdf(options, function (err, pdfFilePath) {
                                    if (err) {
                                        return cb(err);
                                    }

                                    dSignature.addEncryptedDataToDocument(pdfFilePath, secretKey, function (err) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb(null, savedDocumentModel);
                                    });
                                });
                            }
                        ],

                        function (err, savedDocumentModel) {
                            if (err) {
                                return callback(err)
                            }
                            callback(null, savedDocumentModel);
                        }
                    );

                } else {
                    callback(null, savedDocumentModel);
                }

            });

    };

    function setDocumentsCountQuery(params) {
        var DOCUMENTS = TABLES.DOCUMENTS;
        var TEMPLATES = TABLES.TEMPLATES;
        var name = params.name;
        var status = params.status;
        var from = params.from;
        var to = params.to;
        var fromDate;
        var toDate;
        var query = knex(DOCUMENTS)
            .count('id')
            .whereRaw(DOCUMENTS + '.template_id=' + TEMPLATES + '.id');

        if ((status !== undefined) && (status !== 'all')) {
            query.andWhere(DOCUMENTS + '.status', status);
        }

        if (name) {
            name = name.toLowerCase();
            query.whereRaw(
                "LOWER(" + DOCUMENTS + ".name) LIKE '%" + name + "%' "
            );
        }

        if (from) {
            fromDate = new Date(from);
            query.andWhere(DOCUMENTS + '.created_at', '>=', fromDate);
        }

        if (to) {
            toDate = new Date(to);
            query.andWhere(DOCUMENTS + '.created_at', '<=', toDate);
        }

        if (params.companyId) {
            query.andWhere(DOCUMENTS + '.company_id', '=', params.companyId)
        }

        return query;

    };

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

    }

    this.createDocumentContent = createDocumentContent;

    function generateDocumentName(templateModel, userModel) {
        var name = templateModel.get('name');
        var profileModel;
        var username;

        if (userModel && userModel.id && userModel.related('profile')) {
            profileModel = userModel.related('profile');
            username = profileModel.get('first_name') + ' ' + profileModel.get('last_name');
        } else {
            username = 'unknown';
        }

        name += ' (' + username + ')';

        return name;
    };

    function insertIntoDocuments(options, callback) {
        var userModel = options.userModel;
        var assignedUserModel = options.assignedUserModel;
        var templateModel = options.templateModel;
        var currentUserId = options.currentUserId;
        var linkFieldsModels = options.linkFieldsModel;
        var values = options.values;
        var linkModel = templateModel.related('link');
        var templateHtmlContent = templateModel.get('html_content');
        var documentName = generateDocumentName(templateModel, userModel);
        var companyId;
        var companyModel;
        var htmlContent;
        var fields = [];
        var saveData;

        if (userModel && userModel.related('company') && userModel.related('company').length) {
            companyId = userModel.related('company').models[0].id;
        }

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

        saveData = {
            name: documentName,
            html_content: htmlContent,
            template_id: templateModel.id,
            company_id: companyId,
            status: STATUSES.CREATED,
            user_id: userModel.id,
            assigned_id: assignedUserModel.id,
            //created_by: currentUserId
        };

        DocumentModel
            .upsert(saveData)
            .exec(function (err, documentModel) {
                if (err) {
                    return callback(err);
                }
                callback(null, documentModel);
            });
    }

    function createDocument(options, callback) {
        var templateId = options.template_id;
        var userId = options.user_id || options.assigned_id;
        var values;

        if (!templateId) {
            return callback(badRequests.NotEnParams({reqParams: ['template_id']}));
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        }

        async.parallel({
            templateModel: function (cb) {
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
                        cb(badRequests.NotFound({message: 'Template was not found'}));
                    })
                    .catch(cb);

            },
            userModel: function (cb) {
                var criteria = {
                    id: userId
                };
                var fetchOptions = {
                    require: true,
                    withRelated: ['profile', 'company']
                };

                if (!userId) {
                    return cb();
                }

                UserModel
                    .find(criteria, fetchOptions)
                    .then(function (userModel) {
                        cb(null, userModel);
                    })
                    .catch(UserModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound({message: 'The User was not found'}));
                    })
                    .catch(cb);
            }
        }, function (err, models) {
            if (err) {
                return callback(err);
            }

            prepareAndSave(options, models, function (err, documentModel) {
                if (err) {
                    return callback(err);
                }

                models.documentModel = documentModel;
                callback(null, models);
            });
        });
    };

    function updateDocument(id, options, callback) {
        var documentId = id;
        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true
        };
        var values;

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        }

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var templateId = documentModel.get('template_id');
                var companyId = documentModel.get('company_id');
                var userId = options.user_id;

                if (options.companyId && (options.companyId !== companyId)) {
                    return callback(badRequests.AccessError());
                }

                async.parallel({
                    templateModel: function (cb) {
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
                                cb(badRequests.NotFound({message: 'Template was not found'}));
                            })
                            .catch(function (err) {
                                console.log(err);
                                console.log(err.stack);
                                cb(err);
                            });

                    },
                    userModel: function (cb) {
                        var criteria = {
                            id: userId
                        };
                        var fetchOptions = {
                            require: true,
                            withRelated: ['profile', 'company']
                        };

                        if (!userId) {
                            return cb();
                        }

                        UserModel
                            .find(criteria, fetchOptions)
                            .then(function (userModel) {
                                cb(null, userModel);
                            })
                            .catch(UserModel.NotFoundError, function (err) {
                                cb(badRequests.NotFound({message: 'The User was not found'}));
                            })
                            .catch(cb);
                    }
                }, function (err, models) {
                    if (err) {
                        return callback(err);
                    }

                    models.documentModel = documentModel;
                    prepareSaveData(options, models, function (err, documentModel) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, documentModel, models);
                    });
                });
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                callback(badRequests.NotFound({message: 'Document was not found'}));
            })
            .catch(callback);
    };

    function prepareAndSave(options, models, callback) {
        var templateModel = models.templateModel;
        var userModel = models.userModel;
        var documentModel = models.documentModel;
        var templateHtmlContent = templateModel.get('html_content');
        var linkModel = templateModel.related('link');
        var linkFieldsModels;
        var fields = [];
        var companyId;
        var saveData = {
            template_id: templateModel.id,
            status: STATUSES.CREATED
        };
        var documentName;
        var values;
        var htmlContent;

        if (documentModel && documentModel.id) {
            saveData.id = documentModel.id; //update
        } else {
            documentName = generateDocumentName(templateModel, userModel);
            saveData.name = documentName;
        } //else create

        if (userModel && userModel.id) {
            saveData.user_id = userModel.id;
            if (userModel.related('company') && userModel.related('company').length) {
                companyId = userModel.related('company').models[0].id;
                saveData.company_id = companyId;
            }
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
            saveData.values = values;
        }

        if (linkModel && linkModel.related('linkFields')) {
            linkFieldsModels = linkModel.related('linkFields');
            linkFieldsModels.models.forEach(function (model) {
                fields.push(model.toJSON());
            });
        }

        if (values && templateHtmlContent) {
            htmlContent = createDocumentContent(templateHtmlContent, fields, values);
            saveData.html_content = htmlContent;
        }

        //console.log('htmlContent', htmlContent);

        DocumentModel
            .upsert(saveData, function (err, documentModel) {
                if (err) {
                    return callback(err);
                }
                callback(null, documentModel);
            });

    };

    function prepareDocumentToSave(options, models, callback) {
        var templateModel = models.templateModel;
        var userModel = models.userModel;
        var documentModel = models.documentModel = new DocumentModel();
        var currentUserModel = models.currentUserModel;
        var templateHtmlContent = templateModel.get('html_content');
        var linkModel = templateModel.related('link');
        var linkFieldsModels;
        var fields = [];
        var companyId;
        var saveData = {
            template_id: templateModel.id,
            status: STATUSES.CREATED
        };
        var documentName;
        var values;
        var htmlContent = '';
        var now = new Date();

        if (!documentModel.id) {
            documentName = generateDocumentName(templateModel, userModel);
            saveData.name = documentName;
            saveData.created_by = currentUserModel.id;
            saveData.sent_to_company_at = now;
        }

        if (userModel && userModel.id) {
            saveData.user_id = userModel.id;

            if (userModel.related('company') && userModel.related('company').length) {
                companyId = userModel.related('company').models[0].id;
                saveData.company_id = companyId;
            }
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
            saveData.values = values;
        }

        if (linkModel && linkModel.related('linkFields')) {
            linkFieldsModels = linkModel.related('linkFields');
            linkFieldsModels.models.forEach(function (model) {
                fields.push(model.toJSON());
            });
        }

        if (templateHtmlContent) {
            if (values) {
                htmlContent = createDocumentContent(templateHtmlContent, fields, values);
            } else {
                htmlContent = templateHtmlContent;
            }
        }
        saveData.html_content = htmlContent;

        documentModel.set(saveData);

        callback(null, documentModel);
    }

    // This function is return the models what needs to create, sign and send the document
    function getModelsToCreateAndSign(options, callback) {
        var userId = options.user_id;
        var currentUserId = options.currentUserId;
        var assignedId = options.assigned_id;
        var templateId = options.template_id;
        var values;
        var userIds = [
            currentUserId,
            assignedId,
            userId
        ];

        if (!templateId) {
            return callback(badRequests.NotEnParams({reqParams: ['template_id']}));
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        }

        async.parallel({

            templateModel: function (cb) {
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
                        cb(badRequests.NotFound({message: 'Template was not found'}));
                    })
                    .catch(cb);
            },

            users: function (cb) {
                var fetchOptions = {
                    withRelated: ['profile', 'company']
                };

                UserModel
                    .forge()
                    .query(function (qb) {
                        qb.whereIn('id', userIds);
                    })
                    .fetchAll(fetchOptions)
                    .then(function (users) {
                        var userModels = users.models;

                        cb(null, userModels);
                    })
                    .catch(function (err) {
                        cb(err);
                    });
            }

        }, function (err, models) {
            var users;
            var currentUserModel;
            var assignedUserModel;
            var userModel;

            if (err) {
                return callback(err);
            }

            users = models.users;

            currentUserModel = _.find(users, {id: currentUserId});
            assignedUserModel = _.find(users, {id: assignedId});
            userModel = _.find(users, {id: userId});

            models.currentUserModel = currentUserModel;
            models.assignedUserModel = assignedUserModel;
            models.userModel = userModel;

            delete models.users;

            callback(null, models);
        });
    };

    this.createDocumentContent = function (htmlText, fields, values, callback) {

        //check input params:
        if (!htmlText || !htmlText.length || !fields || !values) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['htmlText', 'fields', 'values']}));
            }
            return false;
        }

        fields.forEach(function (field) {
            var fieldName = field.name;
            var searchValue = toUnicode(field.code);
            var replaceValue;

            if (fieldName in values) {
                replaceValue = values[fieldName];
                //replace fields in input html by values
                htmlText = htmlText.replace(new RegExp(searchValue, 'g'), replaceValue);
            }
        });

        //return result
        if (callback && (typeof callback === 'function')) {
            callback(null, htmlText); //all right
        }
        return htmlText;
    };

    this.newDocument = function (req, res, next) {
        var companyId = req.session.companyId;
        var currentUserId = req.session.userId;
        var options = req.body;
        var templateId = options.template_id;
        var assignedId = options.assigned_id || req.session.userId;
        var userId = options.user_id;
        var signImage = options.signature;
        var values;

        console.log('create document');
        console.log(options);

        if (!templateId || !assignedId || !userId) {
            return next(badRequests.NotEnParams({reqParams: ['template_id', 'assigned_id', 'user_id']}));
        }

        if ((assignedId == currentUserId)) {
            if (!signImage || !CONSTANTS.BASE64_REGEXP.test(signImage)) {
                return next(badRequests.NotEnParams({reqParams: ['template_id', 'assigned_id', 'user_id', 'signature']}));
            }
        }

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        }

        async.parallel({

            //try to find the user:
            userModel: function (cb) {
                var criteria = {
                    id: userId
                };
                var fetchOptions = {
                    required: true,
                    withRelated: ['profile', 'company']
                };

                UserModel
                    .find(criteria, fetchOptions)
                    .then(function (userModel) {
                        cb(null, userModel);
                    })
                    .catch(UserModel.NotFoundError, function (err) {
                        (badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //try to find the assigned user: (access to email, check sign_authority)
            assignedUserModel: function (cb) {
                var criteria = {
                    id: assignedId
                };
                var fetchOptions = {
                    required: true,
                    withRelated: ['profile']
                };

                UserModel
                    .find(criteria, fetchOptions)
                    .then(function (userModel) {
                        //TODO: check
                        var profileModel = userModel.related('profile');
                        var signAuthority = profileModel.get('sign_authority');

                        if (signAuthority !== SIGN_AUTHORITY.ENABLED) {
                            return cb(badRequests.AccessError({message: MESSAGES.SIGN_AUTHORITY_ERROR}));
                        }

                        cb(null, userModel);
                    })
                    .catch(UserModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //try to find the template:
            templateModel: function (cb) {
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
            }

        }, function (err, results) {
            var userModel;
            var templateModel;
            var assignedUserModel;
            var insertOptions;

            if (err) {
                return next(err);
            }

            userModel = results.userModel;
            templateModel = results.templateModel;
            assignedUserModel = results.assignedUserModel;

            insertOptions = {
                currentUserId: currentUserId, //created_by
                userModel: userModel,
                templateModel: templateModel,
                assignedUserModel: assignedUserModel,
                values: values
            };

            insertIntoDocuments(insertOptions, function (err, documentModel) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({success: 'success created', model: documentModel});
            });

        });
    };

    this.saveNewDocument = function (req, res, next) {
        var options = req.body;

        createDocument(options, function (err, models) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'success created', model: models.documentModel});
        });
    };

    this.updateDocument = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var documentId = req.params.id;
        var options = req.body;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR)) {
            options.companyId = companyId;
        }

        updateDocument(documentId, options, function (err, documentModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'success update', model: documentModel});
        });
    };

    function signAndSend(documentModel, options) {

    };

    this.signAndSendOld = function (req, res, next) {
        var currentUserId = req.session.userId;
        var documentId = req.params.id;
        var options = req.body;
        var signImage = options.signature;
        var assignedId = options.assigned_id;
        var willBeSignedNow;
        var userIds = [];

        if (!assignedId) {
            return next(badRequests.NotEnParams({reqParams: ['assigned_id']}));
        }

        if (currentUserId == assignedId) {
            if (!signImage) {
                return next(badRequests.NotEnParams({reqParams: ['assigned_id', 'signature']}));
            }

            if (!CONSTANTS.BASE64_REGEXP.test(signImage)) {
                return next(badRequests.InvalidValue({param: 'signature'}));
            }

            userIds = [assignedId];
            willBeSignedNow = true;

        } else {
            userIds = [currentUserId, assignedId];
            willBeSignedNow = false;
        }

        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['company']
        };

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var userId = documentModel.get('user_id');

                userIds.push(userId);

                async.parallel({

                    //check assigned users permissions:
                    users: function (cb) {
                        var criteria = {
                            id: assignedId
                        };
                        var fetchOptions = {
                            required: true,
                            withRelated: ['profile']
                        };

                        UserModel
                            .forge()
                            .query(function (qb) {
                                qb.whereIn('id', userIds);
                            })
                            .fetchAll(fetchOptions)
                            .then(function (users) {
                                cb(null, users.models);
                            })
                            .catch(UserModel.NotFoundError, function (err) {
                                cb(badRequests.NotFound({message: 'The assigned user was not found'}));
                            })
                            .catch(function (err) {
                                console.log(err);
                                console.log(err.stack);
                                cb(err);
                            });
                    }

                }, function (err, results) {
                    //var documentModel;
                    var users;
                    var assignedUserModel;
                    var currentUserModel;
                    var userModel;
                    var documentStatus;

                    if (err) {
                        return next(err);
                    }

                    //documentModel = results.documentModel;
                    users = results.users;
                    //assignedUserModel = results.assignedUserModel;

                    currentUserModel = _.find(users, {id: currentUserId});
                    assignedUserModel = _.find(users, {id: assignedId});
                    userModel = _.find(users, {id: userId});
                    documentStatus = documentModel.get('status');

                    //res.status(200).send({doc: documentModel, currentUser: currentUserModel, assigned: assignedUserModel, userModel: userModel, users: users});

                    if (documentStatus !== STATUSES.CREATED) {
                        return next(badRequests.AccessError({message: 'The document was signed by company'}));
                    }

                    async.waterfall([

                        //save signature and prepare to send:
                        function (cb) {

                            if (willBeSignedNow) {
                                documentModel.saveSignature(assignedId, signImage, function (err, signedDocumentModel) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    cb(null, signedDocumentModel);
                                });
                            } else {
                                documentModel.prepareToSend(assignedId, function (err, updatedDocument) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    cb(null, updatedDocument);
                                });
                            }
                        },

                        //send document to signature:
                        function (documentModel, cb) {
                            var documentJSON = documentModel.toJSON();
                            var company = documentJSON.company;
                            var srcUser = currentUserModel.toJSON();
                            var dstUser;
                            var status = documentJSON.status;
                            var mailerParams;

                            if (status === STATUSES.SENT_TO_SIGNATURE_COMPANY) {
                                dstUser = assignedUserModel.toJSON();
                            } else if (status === STATUSES.SENT_TO_SIGNATURE_CLIENT) {
                                dstUser = userModel.toJSON();
                            } else {
                                console.log('>>> status', status);
                                console.log(documentJSON);
                                return cb(badRequests.InvalidValue({param: 'documents.status', value: status}));
                            }

                            mailerParams = {
                                srcUser: srcUser,
                                dstUser: dstUser,
                                company: company,
                                //template: template,
                                document: documentJSON
                            };

                            console.log(mailerParams.dstUser);
                            mailer.onSendToSingnature(mailerParams);
                            cb(null, documentModel);

                        }

                    ], function (err, signedDocumentModel) {
                        if (err) {
                            return next(err);
                        }
                        res.status(200).send({success: 'success', model: signedDocumentModel});
                    });

                });

            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.signAndSend = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var currentUserId = req.session.userId;
        var documentId = req.params.id;
        var options = req.body;
        var signImage = options.signature;
        var assignedId = options.assigned_id || currentUserId;
        var willBeSignedNow;
        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['company']
        };
        var userIds = [];
        var assignedUserModel;
        var currentUserModel;
        var userModel;
        var check;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            check = companyId;
        }

        if (!assignedId) {
            return next(badRequests.NotEnParams({reqParams: ['assigned_id']}));
        }

        if (currentUserId === assignedId) {
            //if CLIENT try to sign document and signature from canvas is invalid
            if (check && signImage && !CONSTANTS.BASE64_REGEXP.test(signImage)) {
                return next(badRequests.InvalidValue({param: 'signature'}));
            }
            //if member of Mciness company try to sign document from canvas
            if (!check && signImage){
                return next(badRequests.InvalidValue({message:'You must sign document by uploaded signature'}));
            }

            userIds = [assignedId];
            willBeSignedNow = true;

        } else {
            userIds = [currentUserId, assignedId];
            willBeSignedNow = false;
        }

        async.waterfall([

            //find the documentModel:
            function (cb) {
                DocumentModel
                    .find(criteria, fetchOptions)
                    .then(function (documentModel) {
                        var docCompanyId = documentModel.get('company_id');

                        //check if CLIENT try to sign document, he can't sign document not from his company
                        if (check && (check !== docCompanyId)) {
                            return next(badRequests.AccessError());
                        }

                        if (documentModel.get('status') !== STATUSES.CREATED) {
                            return next(badRequests.AccessError({message: 'The document was signed by company'}));
                        }
                        cb(null, documentModel);
                    })
                    .catch(DocumentModel.NotFoundError, function (err) {
                        next(badRequests.NotFound());
                    })
                    .catch(next);
            },

            //check sign_authority and has_sign_image or not
            function (documentModel, cb) {
                var criteria;

                if (!willBeSignedNow) {
                    return cb(null, documentModel);
                }

                criteria = {
                    id: currentUserId
                };

                ProfileModel
                    .forge()
                    .where(criteria)
                    .fetch({require: true})
                    .then(function (profileModel) {
                        var signAuthority = profileModel.get('sign_authority');
                        var hasSignImage = profileModel.get('has_sign_image');

                        if (!signAuthority) {
                            return next(badRequests.AccessError({message: 'You don\'t have sign authority'}))
                        } else {
                            //member of MCinees company must have sign_image
                            if (!check && !hasSignImage) {
                                return next(badRequests.NotEnParams({
                                    message: 'Need upload sign image',
                                    required: 'sign_image'
                                }));
                            }
                        }

                        cb(null, documentModel);
                    })
                    .catch(ProfileModel.NotFoundError, function (err) {
                        return next(badRequests.NotFound())
                    })
                    .catch(next);
            },

            //check is sign_image in request or need to search in DB:
            function (documentModel, cb) {
                var criteria;
                var fetchOptions;

                if (!willBeSignedNow) {
                    return cb(null, documentModel, null);
                }

                if (signImage) {
                    console.log('>>> request signature');
                    return cb(null, documentModel, signImage);
                }

                criteria = {
                    user_id: currentUserId
                };
                fetchOptions = {
                    require: true
                };

                SecretKeyModel
                    .forge()
                    .where(criteria)
                    .fetch(fetchOptions)
                    .then(function (signModel) {
                        var signImage = signModel.get('sign_image');

                        if (!signImage) {
                            return cb(badRequests.NotFound({message: 'Incorrect value of signImage'}));
                        }

                        cb(null, documentModel, signImage);
                    })
                    .catch(SecretKeyModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound({message: 'Signature was not found'}));
                    })
                    .catch(cb);
            },

            //save the document:
            function (documentModel, signImage, cb) {
                if (signImage) {
                    documentModel.saveSignature(assignedId, signImage, function (err, signedDocumentModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, signedDocumentModel);
                    });
                } else {
                    documentModel.prepareToSend(assignedId, function (err, updatedDocument) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, updatedDocument);
                    });
                }
            },

            //find the users:
            function (documentModel, cb) {
                var userId = documentModel.get('user_id');
                var fetchOptions = {
                    withRelated: ['profile']
                };

                userIds.push(userId);

                UserModel
                    .forge()
                    .query(function (qb) {
                        qb.whereIn('id', userIds);
                    })
                    .fetchAll(fetchOptions)
                    .then(function (users) {
                        var userModels = users.models;

                        currentUserModel = _.find(userModels, {id: currentUserId});
                        assignedUserModel = _.find(userModels, {id: assignedId});
                        userModel = _.find(userModels, {id: userId});

                        cb(null, documentModel, userModels);
                    })
                    .catch(function (err) {
                        cb(err);
                    });
            },

            //send mail notification:
            function (documentModel, users, cb) {
                var accessToken = documentModel.get('access_token');
                var documentJSON = documentModel.toJSON();
                var company = documentJSON.company;
                var status = documentJSON.status;
                var srcUser = currentUserModel.toJSON();
                var dstUser;
                var mailerParams;

                if (status === STATUSES.SENT_TO_SIGNATURE_COMPANY) {
                    dstUser = assignedUserModel.toJSON();
                } else if (status === STATUSES.SENT_TO_SIGNATURE_CLIENT) {
                    dstUser = userModel.toJSON();
                } else {
                    console.log('>>> status', status);
                    console.log(documentJSON);
                    return cb(badRequests.InvalidValue({param: 'documents.status', value: status}));
                }
                documentJSON.access_token = accessToken;
                mailerParams = {
                    srcUser: srcUser,
                    dstUser: dstUser,
                    company: company,
                    document: documentJSON
                };
                console.log(documentJSON);
                console.log(mailerParams.dstUser);

                mailer.onSendToSingnature(mailerParams);

                cb(null, documentModel);
            }

        ], function (err, signedDocumentModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'success', model: signedDocumentModel});
        });

    };

    this.createSignAndSend = function (req, res, next) {  //POST /documents/signAndSand;
        var options = req.body;
        var currentUserId = req.session.userId;
        var assignedId = options.assigned_id || currentUserId;

        options.currentUserId = currentUserId;
        options.assigned_id = assignedId;

        /*console.log('>>> createSignAndSend');
        console.log(options);*/

        async.waterfall([

            //get models to create, sign and send:
            function (cb) {
                if (process.env.NODE_ENV !== 'production') {
                    console.time('>>> getModelsToCreateAndSign time');
                }
                getModelsToCreateAndSign(options, function (err, models) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.timeEnd('>>> getModelsToCreateAndSign time');
                    }
                    if (err) {
                        return cb(err);
                    }
                    cb(null, models);
                });
            },

            //create a new document:
            function (models, cb) {
                if (process.env.NODE_ENV !== 'production') {
                    console.time('>>> prepareDocumentToSave time');
                }
                prepareDocumentToSave(options, models, function (err, documentModel) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.timeEnd('>>> prepareDocumentToSave time');
                    }
                    if (err) {
                        return cb(err);
                    }
                    models.documentModel = documentModel;
                    cb(null, models);
                });
            },

            //save the documentModel with signature:
            function (models, cb) {
                var documentModel = models.documentModel;
                var signImage = options.signature;   // use this.companiesSignatureMiddleware

                if (assignedId === currentUserId) {  // document most be signed by the current user
                    if (process.env.NODE_ENV !== 'production') {
                        console.time('>>> documentModel.saveSignature time');
                    }
                    documentModel.saveSignature(assignedId, signImage, function (err, signedDocumentModel) {
                        if (process.env.NODE_ENV !== 'production') {
                            console.timeEnd('>>> documentModel.saveSignature time');
                        }
                        if (err) {
                            return cb(err);
                        }
                        models.documentModel = signedDocumentModel;
                        cb(null, models);
                    });
                } else {                             // assign the document to another user
                    if (process.env.NODE_ENV !== 'production') {
                        console.time('>>> documentModel.prepareToSend time');
                    }
                    documentModel.prepareToSend(assignedId, function (err, updatedDocument) {
                        if (process.env.NODE_ENV !== 'production') {
                            console.time('>>> documentModel.prepareToSend time');
                        }
                        if (err) {
                            return cb(err);
                        }
                        models.documentModel = updatedDocument;
                        cb(null, models);
                    });
                }
            },

            //sending email notification:
            function (models, cb) {
                cb(null, models);
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'success created', models: result, options: options});
        });

    };

    this.getDocuments = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var criteria;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            criteria = {
                company_id: companyId
            }
        }

        DocumentModel
            .forge()
            .query(function (qb) {
                if (criteria) {
                    qb.where(criteria);
                }
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
        var permissions = req.session.permissions;
        var documentId = req.params.id;
        var companyId = req.session.companyId;
        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true
        };
        var check;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            check = companyId;
        }

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var status = documentModel.get('status');
                var docCompanyId = documentModel.get('company_id');
                var AttachmentModel;

                if (check && (check !== docCompanyId)) {
                    return next(badRequests.AccessError());
                }

                if (status === STATUSES.SIGNED_BY_CLIENT) {
                    AttachmentModel = documentModel.related('File');

                    AttachmentModel
                        .fetch()
                        .exec(function (err, attachmentModel) {
                            if (err) {
                                return next(err);
                            }

                            res.status(200).send(documentModel);
                        })
                } else {
                    res.status(200).send(documentModel);
                }
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.previewDocument = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var documentId = req.params.id;
        var criteria = {
            id: documentId
        };
        var fetchOptions = {
            require: true
        };
        var check;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            check = companyId;
        }

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var html = documentModel.get('html_content');
                var docCompanyId = documentModel.get('company_id');

                if (check && (check !== docCompanyId)) {
                    return next(badRequests.AccessError());
                }

                res.status(200).send(html);
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);

    };

    this.getDocumentsByTemplates = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var TEMPLATES = TABLES.TEMPLATES;
        var query = knex(TEMPLATES);
        var params = req.query;
        var page = params.page || 1;
        var limit = params.count;
        var subQuery;
        var subQueryString;
        var fields;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            params.companyId = companyId;
        }

        subQuery = setDocumentsCountQuery(params);
        subQueryString = knex.raw("(" + subQuery.toString() + ") as count");
        fields = [
            TEMPLATES + '.id',
            TEMPLATES + '.name',
            knex.raw(subQueryString)
        ];

        query
            .select(fields)
            .orderBy(TEMPLATES + '.name');

        if (limit) {
            query.offset(( page - 1 ) * limit)
                .limit(limit);
        }

        query
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(rows);
            });
    };

    this.getDocumentsByTemplate = function (req, res, next) {
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var DOCUMENTS = TABLES.DOCUMENTS;
        var templateId = req.params.templateId;
        var params = req.query;
        var name = params.name;
        var status = params.status;
        var from = params.from;
        var to = params.to;
        var fromDate;
        var toDate;
        var orderBy;
        var order;
        var byCompanyId;

        if (templateId) {
            templateId = parseInt(templateId);
            if (isNaN(templateId)) {
                return next(badRequests.InvalidValue({param: 'templateId', value: templateId}));
            }
        }

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            byCompanyId = companyId;
        }

        if (params.orderBy) {
            orderBy = params.orderBy;
        } else {
            orderBy = DOCUMENTS + '.name';
        }

        order = params.order || 'ASC';

        DocumentModel
            .forge()
            .query(function (qb) {

                qb.andWhere(function () {

                    if (name) {
                        name = name.toLowerCase();
                        this.whereRaw(
                            "LOWER(" + DOCUMENTS + ".name) LIKE '%" + name + "%' "
                        );
                    }

                    if ((status !== undefined) && (status !== 'all')) {
                        status = parseInt(status);
                        this.where('status', status);
                    }

                    if (from) {
                        fromDate = new Date(from);
                        this.where(DOCUMENTS + '.created_at', '>=', fromDate);
                    }

                    if (to) {
                        toDate = new Date(to);
                        this.where(DOCUMENTS + '.created_at', '<=', toDate);
                    }

                    if (byCompanyId) {
                        this.where('company_id', byCompanyId);
                    }

                    this.where('template_id', templateId);
                });

                qb.orderBy(orderBy, order);
            })
            .fetchAll()
            .exec(function (err, rows) {
                res.status(200).send(rows);
            });
    };

    this.htmlToPdf = function (req, res, next) {  //for testing, DELETE this method when done
        var html = '<h1>Test</h1><p>Hello world</p><img src="data:image/png;base64, /9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAH4AfgMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABwMEBQYIAgH/xAA3EAABAwMDAgUCBAQGAwAAAAABAAIDBAURBhIhEzEHIkFRYTKBFHGRoRVCYnIjUlOS0eElM0P/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AnFERAREQEREBERAREQERfD24QfUVKOQE7See4+QqqAiIgIiICIiAiIgIiICIiAqZmi6ohMrOoRkM3DcR+S9nsoh1jrSDTtbcoK1j56qom6oi2xgRsDjEC0/VvDWMf3Gd2QW90EpVOGvc+N4AafM7v03fPwRjP2PyriCbqtORte04c0+hXPen7ldDcWXmhrd87mt3VkceIpWkluauHcMY2kbm+3GcKZqatdS/hm1bmR1Za1piALd3+ZjQeXY5LSM9iPzDY0REBERAREQEREBF43knyglMu/yn9v8AlB7XwnC1Y61pTLUOjt1zmoaeV0UldDA2SJrmnDjta4yYBBGdmOD6crFeIPiNZ7DYQaaaOuqq6E/hooJAQWEY6hcOzf3J+5AVrl4iUlJQuqQ2jayd8sVBJJWANlkYcESEDEfvyT6ZwThRANJ3rWl/dV6oukNHW1kwjijaGzOcPL9LWu4YGu3DnkNcfk5zwf09ctQV89wu9a+O19Mf+NHEdSw5a3Mf09MbXAcen3Uz0dlbT1UMz6uonFO0tgjkDMRgjHdrQTxxyUGP0xo6gsNOYmiOocC7Ezogx7w5rQ4SY4fyOOBgYHpk5plvjY5hbLNsYdzY3P3NB+/P2zhXaICIiAiKnI/Zg+mUFRECIKNXVU9FTSVNZPHBBE3c+WRwa1o9yT2VlatQ2W8lzbVdaKrc3u2CdrnD7A5WmeJUjbvqfTOk5amWlgq5X1MssWMkxtJY3kEdwTyD2Cx2s9M/wWi/itzudFXUUDm5fcIuhVR5P/zngAcXfBacoJRBxnnB9F4rOs6lmZA7bM6Nwjf7Oxwf1Ue2K+19qcyY3Q3jTbwwR1srOpJCCAf8R7Bubgc+dmPdwVz4geIH8DsEVVaaWeomrHFkFR0S6GMdt+76Xe7QDygjwXy16S08GvtRdfxIJKapikMc4yf8QTuZhx2vD24dw8YxxkjJw09Hqa2016u1I0UU8jpKVl1a9rYZtwcYxUM7QPy4DeMAjA+dSsembtdKWp1NqF8poJJyHVUw3BzzkCR479IOwHEe/sCp/wBKXKC92Zm6ljp5Ic01VRYBEEjRhzMdiPb3BBQYXQ4qZtVX+f8AB/gqOFsULIOox+15aHuA2Ejbzkdvr7Bb0rehoKO3wCCgpYKaEEkRwxhjcnucBXCAiIgIiICoVgHQc49m8n8vX9iVXXx3IweQgp00hkhaXfUMtd+YOD+4VVYyllbSzSxSuDWDPmd2y0Duf7Nv+1y578SvFS5X2vmobHUy0dojcWNMTtr6jH8ziOQD6D27oJO8VKLqXG0XKhqYW1tM50Q3SAdN5IfE9wznaHsDXfEhPoo88ZNZxas/g9stYeWxx9epiBB2zOGNh+Wjdn81FQbuIDe/YLem+Hd/o9MN1HTsIMbtwa0+Ys9XAY+n59fbHJD3OdWaZfbb3UVlXA+SmZHBMexjbw1hB4c3HbI9c+oJ3zQ99rNR0twlpbK9s9O0PqY6JzG0teSf/W6KTLWvIyct5459Abam8SbRf9BVVLqmnE1dGwMLT5RI7kB+cHb8+/bBzhWngzrmy2NldZ7nI2khnqOvTzyu8v0tbtecccNBB7d+UGfo9YVduifaqt9uqacR9M268AW2pjYeNvIMUjcZAIxnCyPgvT1BivFe6QGilqG09KwPD8thBbuLxw84LW7h32LfpoaSvgaKimgqIiMtErN459eQq9PGyJrWRMayNow1rRgAfCCuiIgIiICIiAiIg1DxNa6LSlxqGxufG6ERT9N217Y3OAc9p9w1z+PXOOey5UuNI+grZaWUgujONzezh3Dh8EEH7rsfUlukutirqKCQRzyxHoyEZDJByw/ZwBXMGoLYamnOyDo1VKH7YS7LgxnMsJ/qicSR6mNwPoEFLStht2pbVU0FLK6LUsbzLSxSPAjrIwOY2+zxgke+f02jw78TanS9NUWe9xvmp42vETJch0bx/IeDgZ7jH794vhllp5WTQyPjlY4OY9hw5pByCD6FbA6tuesdVUks0dHJcZ3Rsy9jYo5nNH1SdgScc+/YILasqRe74fwUDYJKyfbHExuG7nu445wOR/2ck9G6V8LrBp9kEz6WOvr48E1NV5sOHOWt+luD24z8qAbZK64eIcNVLHSW3ZW9eQUseYacReZxDRnygMJP3XUunrobpQF07GxVkDzDVRNOQyQYPHu0ghzT6tcEF8Ync4Df1KNjeDny/uqyIPLd2PNjPwvSIgIiICIiAiIgHkKOvEHQ8tfVvu9ncY5nBrqiONmX9Rn0Ts93tHBb/O3jvhSKiDkfUmn5Gy1E0FMIKmnG+sooxwxv+tF7xH9WHg8YWHirBLaBao7dTPqJKpsraprCZz5dojHu31xjuustQ6bpLrUU1cYYn1tJnoukyBg9xub5m/3Dt6gjha/bbRa7Hen1VDZaCnrpnE9CdrYpQT36EvLXj+ng88kdkGseDWimafdPeNQuiiuMrDDFRvILoGEAnePRxBbx6A898DaLA5ln1bHb4ZQ+mqYgync05D4dr5IfjLNs8fvtEeVmpp7e55NVaLkyU58gpXvDS7OSCzLA45PmBz8qxsDRe9TOvH4FlPRW2B1HRHcHF7nEGU+Xyjbta3gnndk5yAG4oiICIiAiIgIiICIiAiIgKlUU8NVC6CphjmieMOjkaHNcPkFVUQYh2mbM9vTdb4TCRgwHPSI9tmduPssrHGyKNscbWsY0Ya1owAPYL0iAiIgIiICIiAiIg//Z">';
        var name = 'testPdf.pdf';
        var key = attachmentsHandler.computeKey(name);
        var filePath = 'public/uploads/development/pdf/' + key;
        var sK = '987654321012345678995fvhjefklefklef';

        wkhtmltopdf(html, {output: filePath}, function (err) {
            if (err) {
                return next(err);
            }

            async.waterfall([

                //create file
                function (cb) {
                    dSignature.writeKeyToDocument(filePath, null, function (err) {
                        cb(err, filePath);
                    });
                },

                //write encrypted Hash with SecretKey
                function (filePath, cb) {
                    var hash = dSignature.getDocumentHash(filePath);
                    var encryptedHash = dSignature.encryptHash(hash, sK);
                    console.log('1Hash length = ' + hash.length);
                    console.log('1Encrypted length = ' + encryptedHash.length);

                    console.log('Document Hash = ' + hash);
                    console.log('Encrypted Hash = ' + encryptedHash);

                    dSignature.writeKeyToDocument(filePath, encryptedHash, function (err) {
                        cb(err, true);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                dSignature.readKeyFromDocument(filePath, function (err, key) {
                    var decryptedHash = dSignature.decryptHash(key, sK);
                    console.log('2Hash length = ' + key.length);

                    console.log('Decrypted Hash (read from file) = ' + decryptedHash);

                    res.status(200).send('Pdf with name was created');
                });

            });
        });
    };

    //save Encrypted data to pdf file HAVE IDENTICAL FUNCTION dSignature.addEncryptedDataToDocument delete this function later
    this.saveEncryptedDataToDocument = function (req, res, next) {
        var filePath = req.body.path;
        var userId = req.session.userId;
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = dSignature.getDocumentHash(filePath);
        var hashPlusKey;
        var encryptedHash;
        var secretKey;

        async.waterfall([

            function (cb) {
                SecretKeyModel
                    .find({user_id: userId}, {require: true})
                    .then(function (secretKeyModel) {
                        secretKey = secretKeyModel.get('secret_key');
                        cb(null, secretKey);
                    })
                    .catch(SecretKeyModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            function (secretKey, cb) {
                hashPlusKey = hash + secretKey;
                encryptedHash = dSignature.encryptHash(hashPlusKey, openKey);

                dSignature.writeKeyToDocument(filePath, encryptedHash, function (err) {
                    if (err) {
                        return cb(err)
                    }
                    cb();
                });
            }

        ], function (err, result) {
            if (err) {
                return next(err)
            }

            res.status(201).send({success: 'D-Signature was added to document'});
        });
    };

    this.validateDocumentBySecretKey = function (req, res, next) {
        var filePath = req.query.path;
        var userId = req.session.userId;
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = dSignature.getDocumentHash(filePath);
        var decryptedHashPlusKey;
        var decryptedHash;
        var decryptedSecretKey;
        var userName;

        dSignature.readKeyFromDocument(filePath, function (err, encryptedHashPlusKey) {
            if (err) {
                return next(err);
            }

            decryptedHashPlusKey = dSignature.decryptHash(encryptedHashPlusKey, openKey);
            decryptedHash = decryptedHashPlusKey.substring(0, 40);
            decryptedSecretKey = decryptedHashPlusKey.substring(40, decryptedHashPlusKey.length);

            ProfileModel
                .find({user_id: userId}, {require: true})
                .then(function (profileModel) {
                    userName = profileModel.get('first_name') + ' ' + profileModel.get('last_name');

                    if (hash === decryptedHash) {
                        res.status(200).send({success: 'Document not modyfied and signed by ' + userName});
                    } else {
                        res.status(200).send({message: 'Document was modifyed after signing'});
                    }
                })
                .catch(ProfileModel.NotFoundError, function (err) {
                    next(badRequests.NotFound());
                })
                .catch(next);
        });
    };

    this.sendDocumentToSign = function (req, res, next) {
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
        var token = req.params.token;
        var companyId = req.session.companyId;
        var permissions = req.session.permissions;
        var criteria = {
            access_token: token
        };
        var fetchOptions = {
            require: true
        };
        var check;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) &&
            !(permissions === PERMISSIONS.EDITOR) && !(permissions === PERMISSIONS.VIEWVER)) {
            check = companyId;
        }

        DocumentModel
            .find(criteria, fetchOptions)
            .then(function (documentModel) {
                var html = documentModel.get('html_content');
                var docCompanyId = documentModel.get('company_id');

                if (check && (check !== docCompanyId)) {
                    return next(badRequests.AccessError());
                }
                res.status(200).send(html);
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.addSignatureToDocument = function (req, res, next) {
        //var userId = req.session.userId;
        var currentUserId = req.session.userId;
        var companyId = req.session.companyId;
        var token = req.params.token;
        var signImage = req.body.signature;
        var criteria = {
            access_token: token,
            company_id: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['template.link.linkFields', 'company']
        };

        if (!signImage || !CONSTANTS.BASE64_REGEXP.test(signImage)) {
            return next(badRequests.NotEnParams({required: 'signature'}));
        }

        async.waterfall([

            //find the document:
            function (cb) {
                DocumentModel
                    .find(criteria, fetchOptions)
                    .then(function (documentModel) {
                        cb(null, documentModel);
                    })
                    .catch(DocumentModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //check: need to add signature or not
            function (documentModel, cb) {
                var status = documentModel.get('status');
                var assignedId = documentModel.get('assigned_id');
                var docUserId = documentModel.get('user_id');

                if (((status === STATUSES.SENT_TO_SIGNATURE_COMPANY) && (assignedId === currentUserId)) ||
                    ((status === STATUSES.SENT_TO_SIGNATURE_CLIENT) && (docUserId === currentUserId))) {
                    cb(null, documentModel);
                }
                else {
                    cb(badRequests.AccessError());
                }
            },

            //add Sign client or company
            function (documentModel, cb) {
                //addImageSign(documentModel, currentUserId, signImage, cb);
                documentModel.saveSignature(currentUserId, signImage, cb);
            },

            //send to client (if need)
            function (documentModel, cb) {
                var status = documentModel.get('status');
                var userId = documentModel.get('user_id');
                var userIds = [
                    currentUserId,
                    userId
                ];
                var fetchOptions = {
                    required: true,
                    withRelated: ['profile']
                };

                if (status !== STATUSES.SENT_TO_SIGNATURE_CLIENT) {
                    return cb(null, documentModel);
                }

                UserModel
                    .forge()
                    .query(function (qb) {
                        qb.whereIn('id', userIds);
                    })
                    .fetchAll(fetchOptions)
                    .then(function (userModels) {
                        var users = userModels.models;
                        var currentUserModel = _.find(users, {id: currentUserId});
                        var userModel = _.find(users, {id: userId});
                        var srcUser = currentUserModel.toJSON();
                        var dstUser = userModel.toJSON();
                        var document = documentModel.toJSON();
                        var company = document.company;

                        var mailerParams = {
                            srcUser: srcUser,
                            dstUser: dstUser,
                            company: company,
                            //template: template,
                            document: document
                        };

                        mailer.onSendToSingnature(mailerParams);
                        //cb(null, users.models);
                        cb(null, documentModel);
                    })
                    .catch(UserModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound({message: 'The assigned user was not found'}));
                    })
                    .catch(function (err) {
                        console.log(err);
                        console.log(err.stack);
                        cb(err);
                    });


            },

            //if Client signed the document need to CREATE PDF
            function (documentModel, cb) {
                var status = documentModel.get('status');
                var pdfOptions = {};
                var htmlContent;

                if (status !== STATUSES.SIGNED_BY_CLIENT) {
                    return cb(null, documentModel);
                }

                htmlContent = documentModel.get('html_content');
                pdfOptions.html = htmlContent;
                pdfOptions.documentId = documentModel.id;

                saveHtmlToPdf(pdfOptions, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, documentModel, result);
                });
            },

            //try to insert into attachments:
            function (documentModel, pdfParams, cb) {
                var data;

                if (!pdfParams) {
                    return cb(null, documentModel);
                }

                data = {
                    attacheable_id: documentModel.id,
                    attacheable_type: TABLES.DOCUMENTS,
                    name: pdfParams.name,
                    key: pdfParams.key
                };

                attachmentsHandler.saveAttachment(data, function (err, attachmentModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, documentModel);
                });
            }

        ], function (err, savedDocumentModel) {
            if (err) {
                return next(err)
            }
            res.status(201).send({success: 'Document was signed'});
        });

    };

    this.companiesSignatureMiddleware = function (req, res, next) {
        var options = req.body;
        var currentUserId = req.session.userId;
        var assignedId = options.assigned_id || currentUserId;
        var companyId = req.session.companyId;
        var columns;

        if (companyId !== CONSTANTS.DEFAULT_COMPANY_ID) {
            return next(); //this is a client user. The client user can't have saved sign image;
        }

        if (currentUserId !== assignedId) {
            return next(); //it will be signed by another user;
        }

        columns = [
            TABLES.PROFILES + '.user_id',
            'has_sign_image', //profiles
            'permissions',    //profiles
            'sign_authority', //profiles
            'sign_image'      //users_secret_keys
        ];

        knex(TABLES.PROFILES)
            .leftJoin(
                TABLES.USERS_SECRET_KEY,
                TABLES.PROFILES + '.user_id',
                TABLES.USERS_SECRET_KEY + '.user_id'
            ).where(TABLES.PROFILES + '.user_id', currentUserId)
            .select(columns)
            .then(function (rows) {
                var row;
                var signImage;

                if (!rows || !rows.length) {
                    return next(badRequests.NotFound({message: 'Profile was not found'}));
                }

                row = rows[0];

                if (row.sign_authority === false) {
                    return next(badRequests.AccessError({message: 'You don\'t have sign authority'}));
                }

                signImage = row.sign_image;
                if (!signImage) {
                    return next(badRequests.NotFound({message: 'Sign image was not found'}));
                }

                options.signature = signImage;
                next();
            })
            .catch(function (err) {
                next(err);
            });
    };
};

module.exports = DocumentsHandler;