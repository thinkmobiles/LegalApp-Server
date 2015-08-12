'use strict';

var TABLES = require('../constants/tables');
var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var PERMISSIONS = require('../constants/permissions');
var BUCKETS = require('../constants/buckets');

var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var mammoth = require('mammoth');

var badRequests = require('../helpers/badRequests');

var SessionHandler = require('../handlers/sessions');

var TemplatesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var uploader = PostGre.Models.Image.uploader;
    var TemplateModel = Models.Template;
    var AttachmentModel = Models.Attachment;
    var session = new SessionHandler(PostGre);
    var self = this;

    function random(number) {
        return Math.floor((Math.random() * number));
    };

    function computeKey(name) {
        var ticks_ = new Date().valueOf();
        var key;

        key = ticks_ + '_' + random(1000) + '_' + name;

        return key;
    };

    this.prepareSaveData = function (params) {
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
        var templateFile = req.files.templateFile;
        var name = options.name;
        var linkId = options.link_id;
        var originalFilename;
        var extension;

        if (!name || !linkId || !templateFile) {
            return next(badRequests.NotEnParams({reqParams: ['name', 'link_id', 'templateFile']}));
        }

        originalFilename = templateFile.originalFilename;
        extension = originalFilename.slice(-4);

        if (extension !== 'docx') {
            return next(badRequests.InvalidValue({message: 'Incorrect file type'}));
        }

        async.waterfall([

            //save the docx file:
            function (cb) {
                self.saveTheTemplateFile(templateFile, function (err, key) {
                    console.log('>>> save template file -------------------------------');

                    if (err) {
                        console.error(err);
                        return cb(err);
                    }
                    //TODO: save to attachments ...
                    console.log('success. key = ', key);
                    console.log('>>> --------------------------------------------------');
                    cb(null, key);
                });
            },

            //convert docx to html:
            function (key, cb) {
                var bucket = BUCKETS.TEMPLATE_FILES;
                var filePath = uploader.getFilePath(key, bucket);
                var htmlContent = '';

                mammoth.convertToHtml({path: filePath})
                    .then(function(result){
                        var messages = result.messages; // Any messages, such as warnings during conversion

                        if (messages && messages.length) {
                            console.error(messages);
                        }

                        htmlContent = result.value; // The generated HTML

                        cb(null, key, htmlContent);
                    })
                    .done();

                //cb(null, key, htmlContent);
            },

            //insert into templates:
            function (key, htmlContent, cb) {
                var saveData = {
                    name: name,
                    link_id: linkId,
                    company_id: companyId,
                    html_content: htmlContent
                };

                TemplateModel
                    .upsert(saveData, function (err, templateModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, templateModel, key);
                    });
            },

            //save into attachments:
            function (templateModel, key, cb) {
                var saveData = {
                    attacheable_type: TABLES.TEMPLATES,
                    attacheable_id: templateModel.id,
                    name: BUCKETS.TEMPLATE_FILES,
                    key: key
                };

                AttachmentModel
                    .upsert(saveData, function (err, attachmentModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, templateModel);
                    });

            }

        ], function (err, templateModel) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: MESSAGES.SUCCESS_CREATED_TEMPLATE, model: templateModel});
        });
    };

    this.saveTheTemplateFile = function (file, callback) {
        var originalFilename = file.originalFilename;
        var extension = originalFilename.slice(-4);

        async.waterfall([

            //get file from request:
            function (cb) {

                fs.readFile(file.path, function (err, data) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, data);
                });
            },

            //save file to storage:
            function (buffer, cb) {
                var bucket = BUCKETS.TEMPLATE_FILES;
                //var name = BUCKETS.TEMPLATE_FILES;
                var name = originalFilename;
                var key = computeKey(name);
                var fileData;

                if (process.env.NODE_ENV !== 'production') {
                    console.log('--- Upload file ----------------');
                    console.log('name', name);
                    console.log('key', key);
                    console.log('bucket', bucket);
                    console.log('--------------------------------');
                }

                fileData = {
                    data: buffer,
                    name: key //look like: 1439330842375_121_myFileName.docx
                };

                uploader.uploadFile(fileData, key, bucket, function (err, fileName) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, key);
                });
            }

        ], function (err, result) {


            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, result);
                }
            }
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
            .fetchAll({withRelated: ['templateFile']})
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
            withRelated: ['link', 'templateFile']
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

    this.removeTemplate = function (req, res, next) {
        var companyId = req.session.companyId;
        var templateId = req.params.id;
        var criteria = {
            id: templateId,
            company_id: companyId
        };
        var fetchParams = {
            require: true
        };

        async.waterfall([

            //try to find the template:
            function (cb) {

                TemplateModel
                    .find(criteria, fetchParams)
                    .then(function (templateModel) {
                        cb(null, templateModel);
                    })
                    .catch(TemplateModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound());
                    })
                    .catch(cb);
            },

            //try to remove the deps.:
            function (templateModel, cb) {
                templateModel.removeDependencies(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, templateModel);
                });
            },

            //try to remove the template:
            function (templateModel, cb) {
                templateModel
                    .destroy()
                    .exec(function (err) {
                        if (err) {
                            cb(err);
                        }
                        cb();
                    });
            }

        ], function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'Success removed'});
        });
    };

    this.updateTemplate = function (req, res, next) {
        var templateSaveData = self.prepareSaveData(req.body);
        var templateId = req.params.id;
        var companyId = req.session.companyId;
        var criteria = {
            id: templateId,
            company_id: companyId
        };
        var fetchOptions = {
            require: true
        };

        if (Object.keys(templateSaveData).length === 0) {
            return next(badRequests.NotEnParams({message: 'Nothing to update'}))
        }

        async.waterfall([

            //try to find the template:
            function (cb) {

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

            //try to update template:
            function (templateModel, cb) {
                templateModel
                    .save(templateSaveData, {patch: true})
                    .exec(function (err, tempModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, templateModel);
                    });
            }

        ], function (err, templateModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'Success updated', model: templateModel});
        });
    };

    this.previewTemplate = function (req, res, next) {
        var templateId = req.params.id;
        var criteria = {
            id: templateId
        };
        var fetchOptions = {
            require: true
        };

        TemplateModel
            .find(criteria, fetchOptions)
            .then(function (templateModel) {
                var html = templateModel.get('html_content');

                res.status(200).send(html);
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.createDocument = function (htmlText, fields, values, callback) {

        //check input params
        if (htmlText.length && (Object.keys(fields).length !== 0) && (Object.keys(values).length !== 0)) {

            for (var i in values) {
                var val = values[i];
                var code = fields[i];

                //replace fields in input html by values
                htmlText = htmlText.replace(new RegExp(code, 'g'), val);
            }

            //return result
            if (callback && (typeof callback === 'function')) {
                callback(null, htmlText); //all right
            }
            return htmlText;

        } else {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({required: ['htmlText', 'values', 'fields']}));
            }
            return '';
        }
    };
};

module.exports = TemplatesHandler;