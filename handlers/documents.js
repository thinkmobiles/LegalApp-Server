'use strict';


var CONSTANTS = require('../constants/index');
var SIGN_AUTHORITY = require('../constants/signAuthority');
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
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');
var wkhtmltopdf = require('wkhtmltopdf');
var AttachmentsHandler = require('./attachments');
var path = require('path');
var fs = require('fs');
var Buffer = require('buffer').Buffer;
var crypto = require('crypto');

var DocumentsHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var ProfileModel = Models.Profile;
    var FieldModel = Models.Field;
    var DocumentModel = Models.Document;
    var TemplateModel = Models.Template;
    var LinkFieldsModel = Models.LinkFields;
    var SecretKeyModel = Models.SecretKey;
    var ProfileModel = Models.Profile;
    var attachmentsHandler = new AttachmentsHandler(PostGre);
    var self = this;

    function encryptHash(text, userSecretKey) {
        var algorithm = 'aes-256-ctr';
        var password = userSecretKey || 'd6F3Efeq';
        var cipher = crypto.createCipher(algorithm, password);
        var crypted = cipher.update(text, 'utf8', 'hex');

        crypted += cipher.final('hex');

        return crypted;
    }

    function decryptHash(text, userSecretKey) {
        var algorithm = 'aes-256-ctr';
        var password = userSecretKey || 'd6F3Efeq';
        var decipher = crypto.createDecipher(algorithm, password);
        var dec = decipher.update(text, 'hex', 'utf8');

        dec += decipher.final('utf8');

        return dec;
    }

    function getDocumentHash(filePath) {
        var shasum = crypto.createHash('sha1');
        var fileData = fs.readFileSync(filePath);
        var data = fileData.toString();
        var startIndex = data.indexOf('SecretKey/');
        var message;

        if (startIndex !== -1) {
            message = data.substring(12 + CONSTANTS.KEY_LENGTH, fileData.length);
        } else {
            message = data;
        }

        shasum.update(message);

        return shasum.digest('hex');
    }

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

    function writeKeyToDocument(filePath, key, callback) {
        var dataBuffer = fs.readFileSync(filePath);
        var data = dataBuffer.toString();
        var startIndex = data.indexOf('SecretKey/');
        var secretKey = 'SecretKey/' + key + '/\n';
        var newBuffer = new Buffer(secretKey, 'utf8');

        //check if need to replace old value
        if (startIndex !== -1) {
            dataBuffer = dataBuffer.slice(newBuffer.length, dataBuffer.length);
        }

        if (key === null) {
            newBuffer = dataBuffer;
        } else {
            newBuffer = Buffer.concat([newBuffer, dataBuffer]);
        }

        fs.writeFile(filePath, newBuffer, function (err) {
            if (err) {
                return callback(err);
            }
            callback(null, true);
        });
    }

    function readKeyFromDocument(filePath, callback) {
        var data = fs.readFileSync(filePath, 'utf8');
        var startIndex = data.indexOf('SecretKey/') + 10; // 'SecretKey/'.length=10
        var keyLength = startIndex + CONSTANTS.KEY_LENGTH;
        var key;

        if (startIndex === -1) {
            callback(badRequests.NotFound({required: 'key'}));
        } else {
            key = data.substring(startIndex, keyLength);
            callback(null, key);
        }
    }

    function saveHtmlToPdf(options, callback) {
        var name = CONSTANTS.DEFAULT_DOCUMENT_NAME;
        var key = attachmentsHandler.computeKey(name);
        var filePath = path.join(process.env.AMAZON_S3_BUCKET, BUCKETS.PDF_FILES, key);
        var html;

        if (!options && !options.html) {
            return callback(badRequests.NotEnParams({required: 'html'}));
        }

        html = options.html;

        wkhtmltopdf(html, {output: filePath}, function (err) {
            if (err) {
                return callback(err);
            }
            callback(null, filePath);
        });
    }

    function addEncryptedDataToDocument(filePath, userId, callback) {
        //var filePath = req.body.path || 'public/uploads/development/pdf/1440153258967_120_testPdf.pdf';
        //var userId = req.session.userId;
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = getDocumentHash(filePath);
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
                encryptedHash = encryptHash(hashPlusKey, openKey);

                writeKeyToDocument(filePath, encryptedHash, function (err) {
                    if (err) {
                        return cb(err)
                    }
                    cb();
                });
            }

        ], function (err, result) {
            if (err) {
                return callback(err)
            }

            callback(null, {success: 'D-Signature was added to document'});
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

                    saveHtmlToPdf(options, function (err, pdfFilePath) {
                        if (err) {
                            return callback(err);
                        }

                        addEncryptedDataToDocument(pdfFilePath, userId, function (err) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, savedDocumentModel);
                        });
                    });

                } else {
                    callback(null, savedDocumentModel);
                }

            });

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
        var profileModel = userModel.related('profile');
        
        name += ' (' + profileModel.get('first_name') + ' ' + profileModel.get('last_name')  + ')';

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

    function createDocument(options, callback) {};

    function updateDocument(id, options, callback) {};

    function prepareSaveData(options, models, callback) {
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
        } //else create

        if (userModel && userModel.id) {
            documentName = generateDocumentName(templateModel, userModel);
            saveData.user_id = userModel.id;
            saveData.name = documentName;

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

    this.saveNewDocument = function (req, res, next) {
        var options = req.body;
        var templateId = options.template_id;
        var userId = options.user_id;
        var values;

        console.log('create document');
        console.log(options);

        if (!templateId) {
            return next(badRequests.NotEnParams({ reqParams: ['template_id'] }));
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
                    withRelated: ['profile']
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
                return next(err);
            }

            prepareSaveData(options, models, function (err, documentModel) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({ success: 'success created', model: documentModel });
            });
        });
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
            return next(badRequests.NotEnParams({ reqParams: ['template_id', 'assigned_id', 'user_id'] }));
        }
        
        if ((assignedId == currentUserId)) {
            if (!signImage || !CONSTANTS.BASE64_REGEXP.test(signImage)) {
                return next(badRequests.NotEnParams({ reqParams: ['template_id', 'assigned_id', 'user_id', 'signature']}));
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
                res.status(201).send({ success: 'success created', model: documentModel });
            });

        });
    };

    this.updateDocument = function (req, res, next) {
        var options = req.body;
        var documentId = req.params.id;
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
                var userId = options.user_id;

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
                            withRelated: ['profile']
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
                        return next(err);
                    }

                    models.documentModel = documentModel;
                    prepareSaveData(options, models, function (err, documentModel) {
                        if (err) {
                            return next(err);
                        }
                        res.status(200).send({ success: 'success updated', model: documentModel });
                    });
                }) ;
            })
            .catch(DocumentModel.NotFoundError, function (err) {
                next(badRequests.NotFound({message: 'Document was not found'}));
            })
            .catch(next);
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
        var criteria = {
            id: documentId
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
        var params = req.query;
        var fields = [
            TABLES.TEMPLATES + '.id',
            TABLES.TEMPLATES + '.name'/*,
             'documents.created_at'*/
        ];
        var status = params.status;
        var templateName = params.templateName;
        var userName = params.userName;
        var orderBy;
        var order;
        var query = knex(TABLES.TEMPLATES)
            .innerJoin(TABLES.DOCUMENTS, TABLES.TEMPLATES + '.id', TABLES.DOCUMENTS + '.template_id')
            .innerJoin(TABLES.PROFILES, TABLES.PROFILES + '.user_id', TABLES.DOCUMENTS + '.assigned_id');

        if ((status !== undefined) && (status !== 'all')) {
            query.where(TABLES.DOCUMENTS + '.status', status);
        }

        if (templateName) {
            templateName = templateName.toLowerCase();
            query.whereRaw(
                "LOWER(name) LIKE '%" + templateName + "%' "
            );
        }

        if (userName) {
            userName = userName.toLowerCase();
            query.whereRaw(
                "LOWER(first_name) LIKE '%" + userName + "%' "
                + "OR LOWER(last_name) LIKE '%" + userName + "%' "
                + "OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%" + userName + "%' "
            );
        }

        if (params.orderBy) {
            orderBy = params.orderBy;

            if (orderBy === 'created_at') {
                orderBy = TABLES.TEMPLATES + '.created_at';
            }

        } else {
            orderBy = TABLES.TEMPLATES + '.name';
        }
        order = params.order || 'ASC';

        query
            .select(fields)
            .groupBy(fields)
            .count(TABLES.TEMPLATES + '.id')
            .orderBy(orderBy, order)
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(rows);
            });
    };

    this.getDocumentsByTemplate = function (req, res, next) {
        var templateId = req.params.templateId;
        var companyId = req.session.companyId;
        var criteria = {
            id: templateId
        };
        var fetchOptions = {
            require: true//,
            //withRelated: ['documents']
        };
        var fields = [
            TABLES.DOCUMENTS + '.created_at'
        ];

        var columns = [
            //'documents.*',
            //'templates.name',
            'profiles.first_name',
            'profiles.last_name',
            knex.raw(
                "CONCAT(templates.name, ' ', COALESCE(" + TABLES.PROFILES + ".first_name, ''), ' ', " + 'COALESCE(' + TABLES.PROFILES + ".last_name, '')) AS name"
            )
        ];
        var params = req.query;
        var name = params.templateName;
        var userName = params.userName;
        var status = params.status;
        var orderBy;
        var order;

        if (templateId) {
            templateId = parseInt(templateId);
            if (isNaN(templateId)) {
                return next(badRequests.InvalidValue({param: 'templateId', value: req.params.templateId}));
            }
        }

        if (params.orderBy) {
            orderBy = params.orderBy;
        } else {
            orderBy = TABLES.DOCUMENTS + '.created_at';
        }

        order = params.order || 'ASC';

        DocumentModel
            .forge()
            .query(function (qb) {
                qb.innerJoin(TABLES.TEMPLATES, function () {
                    this.on(TABLES.TEMPLATES + '.id', TABLES.DOCUMENTS + '.template_id')
                        .on("templates.id", templateId)
                })
                    .innerJoin(TABLES.PROFILES, TABLES.PROFILES + '.user_id', TABLES.DOCUMENTS + '.assigned_id');

                qb.where({
                    'templates.id': templateId,
                    'documents.company_id': companyId
                });

                if (name) {
                    name = name.toLowerCase();
                    qb.whereRaw(
                        "LOWER(name) LIKE '%" + name + "%' "
                    );
                }

                if (userName) {
                    userName = userName.toLowerCase();
                    qb.whereRaw(
                        "LOWER(first_name) LIKE '%" + userName + "%' "
                        + "OR LOWER(last_name) LIKE '%" + userName + "%' "
                        + "OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%" + userName + "%' "
                    );
                }

                if ((status !== undefined) && (status !== 'all')) {
                    status = parseInt(status);
                    qb.where('status', status);
                }

                qb.orderBy(orderBy, order)
                    .select(columns);
            })
            .fetchAll(/*{withRelated: ['assignedUser.profile']}*/)
            .exec(function (err, rows) {
                /*var documents;
                var documentsJSON = [];

                if (err) {
                    return next(err);
                }

                documents = rows.models;
                documents.forEach(function (doc) {
                    var assignedUser;
                    var docJSON = doc.toJSON();

                    if (docJSON.assignedUser && docJSON.assignedUser.id) {
                        assignedUser = docJSON.assignedUser;
                        docJSON.name += ' ('+ assignedUser.profile.first_name + ' ' + assignedUser.profile.last_name + ')';
                    }
                    documentsJSON.push(docJSON);
                });*/


                res.status(200).send(rows);
            });

        /*TemplateModel
            .find(criteria, fetchOptions)
            .then(function (templateModel) {
                var documents = templateModel.related('documents').model;

                documents
                    .query(function (qb) {
                        qb.where('template_id', templateId); //TODO: ???

                        if ((status !== undefined) && (status !== 'all')) {
                            status = parseInt(status);
                            qb.where('status', status);
                        }
                        qb.orderBy(orderBy, order);
                    })
                    .fetchAll({
                        withRelated: ['assignedUser']
                    })
                    .exec(function (err, documentModels) {
                        var documentsJSON = [];
                        var json;

                        if (err) {
                            return next(err);
                        }

                        documentModels.forEach(function (model) {
                            documentsJSON.push(model.toJSON());
                        });

                        json = templateModel.toJSON();
                        json.documents = documentsJSON;

                        res.status(200).send(json);
                    });
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);*/
    };

    this.htmlToPdf = function (req, res, next) {  //for testing, DELETE this method when done
        var html = '<h1>Test</h1><p>Hello world</p><img src="data:image/png;base64, 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">';
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
                    writeKeyToDocument(filePath, null, function (err) {
                        cb(err, filePath);
                    });
                },

                //write encrypted Hash with SecretKey
                function (filePath, cb) {
                    var hash = getDocumentHash(filePath);
                    var encryptedHash = encryptHash(hash, sK);
                    console.log('1Hash length = ' + hash.length);
                    console.log('1Encrypted length = ' + encryptedHash.length);

                    console.log('Document Hash = ' + hash);
                    console.log('Encrypted Hash = ' + encryptedHash);

                    writeKeyToDocument(filePath, encryptedHash, function (err) {
                        cb(err, true);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                readKeyFromDocument(filePath, function (err, key) {
                    var decryptedHash = decryptHash(key, sK);
                    console.log('2Hash length = ' + key.length);

                    console.log('Decrypted Hash (read from file) = ' + decryptedHash);

                    res.status(200).send('Pdf with name was created');
                });

            });
        });
    };

    //save Encrypted data to pdf file HAVE IDENTICAL FUNCTION addEncryptedDataToDocument
    this.saveEncryptedDataToDocument = function (req, res, next) {
        var filePath = req.body.path || 'public/uploads/development/pdf/1440153258967_120_testPdf.pdf';
        var userId = req.session.userId;
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = getDocumentHash(filePath);
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
                encryptedHash = encryptHash(hashPlusKey, openKey);

                writeKeyToDocument(filePath, encryptedHash, function (err) {
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
        var filePath = req.query.path || 'public/uploads/development/pdf/1440153258967_120_testPdf.pdf';
        var userId = req.session.userId;
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = getDocumentHash(filePath);
        var decryptedHashPlusKey;
        var decryptedHash;
        var decryptedSecretKey;
        var userName;

        readKeyFromDocument(filePath, function (err, encryptedHashPlusKey) {
            if (err) {
                return next(err);
            }

            decryptedHashPlusKey = decryptHash(encryptedHashPlusKey, openKey);
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
        var token = req.params.token;
        var companyId = req.session.companyId;
        var criteria = {
            access_token: token,
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

    this.addSignatureToDocument = function (req, res, next) {
        var userId = req.session.userId;
        var companyId = req.session.companyId;
        var token = req.params.token;
        var signImage = req.body.signature;    //base64  need to check params
        var criteria = {
            access_token: token,
            company_id: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['template.link.linkFields']
        };

        if (!signImage || !CONSTANTS.BASE64_REGEXP.test(signImage)) {
            return next(badRequests.NotEnParams({required: 'signature'}));
        }

        async.waterfall([

            //find document
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

                if (((status === STATUSES.SENT_TO_SIGNATURE_COMPANY) && (assignedId === userId)) ||
                    ((status === STATUSES.SENT_TO_SIGNATURE_CLIENT) && (docUserId === userId))) {
                    cb(null, documentModel);
                }
                else {
                    return cb(badRequests.AccessError());
                }
            },

            //add Sign client or company
            function (documentModel, cb) {
                addImageSign(documentModel, userId, signImage, cb);
            }

        ], function (err, savedDocumentModel) {
            if (err) {
                return next(err)
            }
            res.status(201).send({success: 'Document was signed'});
        });

    };
};

module.exports = DocumentsHandler;