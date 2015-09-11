'use strict';

var TABLES = require('../constants/tables');
var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var PERMISSIONS = require('../constants/permissions');
var BUCKETS = require('../constants/buckets');

var fs = require('fs');
var async = require('async');
var _ = require('lodash');

var badRequests = require('../helpers/badRequests');

var SessionHandler = require('../handlers/sessions');
var AttachmentHandler = require('../handlers/attachments');
var DocumentsHandler = require('../handlers/documents');
var MammothHandler = require('../handlers/mammoth');

var TemplatesHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var uploader = PostGre.Models.Image.uploader;
    var TemplateModel = Models.Template;
    var AttachmentModel = Models.Attachment;
    var LinkedTemplatesModel = Models.LinkedTemplates;
    var session = new SessionHandler(PostGre);
    var attachments = new AttachmentHandler(PostGre);
    var documentsHandler = new DocumentsHandler(PostGre);
    var mammothHandler = new MammothHandler();
    var self = this;

    function saveLinkedTemplates(saveData, cb) {
        LinkedTemplatesModel
            .upsert(saveData, function (err, linkedTemplatesModel) {
                if (err) {
                    return cb(err);
                }
                cb();
            });
    }

    function getTemplateWithStyle(options, callback) {
        var templateId = options.templateId;

        async.parallel({

            // get the html_content
            templateModel: function (cb) {
                var criteria = {
                    id: templateId
                };
                var fetchOptions = {
                    require: true
                };

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

            cssContent: function (cb) {

                fs.readFile('public/stylesheets/pdfStyle.css', function (err, content) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, content);
                });
            }

        }, function (err, results) {
            var templateModel;
            var cssContent;
            var htmlContent;

            if (err) {
                return callback(err);
            }

            templateModel = results.templateModel;
            cssContent = results.cssContent;

            htmlContent = '<style>' + cssContent + '</style>' + templateModel.get('html_content');
            templateModel.set('html_content', htmlContent);

            callback(null, templateModel);

        });
    };

    this.docx2html = function (req, res, next) {
        var file = req.files.file;
        var filePath;
        var converterParams;

        if (!file) {
            return next(badRequests.NotEnParams({reqParams: ['file']}));
        }

        filePath = file.path;
        console.log('>>>', filePath);
        converterParams = {
            path: filePath
        };

        mammothHandler.docx2html(converterParams, function(htmlContent){
            if (!htmlContent){
                return next(badRequests.InvalidValue({message:'Nothing for convertation'}))
            }
            res.send(htmlContent);
        });
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
        var options = req.body;
        var templateFile = req.files.templateFile;
        var name = options.name;
        var linkId = options.link_id;
        var description = options.description;
        var marketingContent = options.marketing_content;
        var hasLinkedTemplate = false;
        var linkedTemplates = options.linked_templates;
        var linkedTemplatesArray;
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

        if (linkedTemplates) {
            hasLinkedTemplate = true;
            if (Array.isArray(linkedTemplates)) {
                linkedTemplatesArray = options.linked_templates;
            } else {
                linkedTemplatesArray = [options.linked_templates];
            }
        }

        async.waterfall([

            //save the docx file:
            function (cb) {
                attachments.saveTheTemplateFile(templateFile, function (err, key) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    }
                    cb(null, key);
                });
            },

            //convert docx to html:
            function (key, cb) {
                var bucket = BUCKETS.TEMPLATE_FILES;
                var filePath = uploader.getFilePath(key, bucket);
                var htmlContent = '';
                var converterParams = {
                    path: filePath
                };

                mammothHandler.docx2html(converterParams, function(htmlContent){
                    if (!htmlContent){
                        return next(badRequests.InvalidValue({message:'Nothing for convertation'}))
                    }
                    cb(null, key, htmlContent);
                });
            },

            //get linked template if need:
            function (key, htmlContent, cb) {
                if (!hasLinkedTemplate) {
                    return cb(null, key, htmlContent);
                }

                knex(TABLES.TEMPLATES)
                    .whereIn('id', linkedTemplatesArray)
                    .select(['id', 'html_content'])
                    .exec(function (err, rows) {
                        if (err) {
                            return cb(err);
                        }

                        rows.forEach(function (row) {
                            htmlContent += documentsHandler.HTML_BRAKE_PAGE;
                            htmlContent += row.html_content;
                        });

                        cb(null, key, htmlContent);
                    });
            },

            //insert into templates:
            function (key, htmlContent, cb) {
                var saveData = {
                    name: name,
                    description: description,
                    link_id: linkId,
                    html_content: htmlContent,
                    marketing_content: marketingContent,
                    has_linked_template: hasLinkedTemplate
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

                attachments.saveAttachment(saveData, function (err, attachmentModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, templateModel);
                });

                /*var saveData = {
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
                 });*/

            },

            //insert into linked_templates
            function (templateModel, cb) {

                if (!linkedTemplatesArray) {
                    return cb(null, templateModel);
                }

                async.each(linkedTemplatesArray,
                    function (linkedTemplateId, eachCb) {
                        var saveData = {
                            template_id: templateModel.id,
                            linked_id: linkedTemplateId
                        };

                        saveLinkedTemplates(saveData, eachCb);
                    },

                    function (err) {
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

    this.getTemplates = function (req, res, next) {

        TemplateModel
            .findAll()
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
        var templateId = req.params.id;
        var criteria = {
            id: templateId
        };
        var fetchParams = {
            require: true,
            withRelated: ['link', 'templateFile', 'linkedTemplates']
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
        var permissions = req.session.permissions;
        var templateId = req.params.id;
        var criteria = {
            id: templateId
        };
        var fetchParams = {
            require: true
        };

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) && !(permissions === PERMISSIONS.EDITOR)) {
            return next(badRequests.AccessError());
        }

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
        var options = req.body;
        var templateId = req.params.id;
        var permissions = req.session.permissions;
        var templateSaveData;

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) && !(permissions === PERMISSIONS.EDITOR)) {
            return next(badRequests.AccessError());
        }

        templateSaveData = self.prepareSaveData(options);

        if (!Object.keys(templateSaveData).length) {
            return next(badRequests.NotEnParams({message: 'Nothing to update'}))
        }

        TemplateModel
            .forge({
                id: templateId
            })
            .save(templateSaveData, {patch: true})
            .then(function (templateModel) {
                res.status(200).send({success: 'Success updated', model: templateModel});
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound({message: 'Template was not found'}));
            })
            .catch(function (err) {
                if (badRequests.isNoRowsUpdatedError(err)) {
                    return next(badRequests.NotFound({message: 'Template was not found'}));
                }
                next(err);
            });
    };

    this.previewTemplate = function (req, res, next) {
        var templateId = req.params.id;
        var options = {
            templateId: templateId
        };

        getTemplateWithStyle(options, function (err, templateModel) {
            var html;

            if (err) {
                return next(err);
            }

            html = templateModel.get('html_content');
            res.status(200).send(html);
        });
    };

    this.previewDocument = function (req, res, next) {
        var templateId = req.params.id;
        var options = req.body;
        var templateOptions = {
            templateId: templateId
        };
        var values;

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        } else {
            return next(badRequests.NotEnParams({reqParams: 'values'}));
        }

        documentsHandler.getTemplateModelWithLinks(templateOptions, function (err, templateModel) {
            var templateHtmlContent;
            var linkModel;
            var fields;
            var htmlContent;
            var linkFieldsModels;

            if (err) {
                return next(err);
            }

            templateHtmlContent = templateModel.get('html_content');
            linkModel = templateModel.related('link');
            fields = [];

            if (linkModel && linkModel.related('linkFields')) {
                linkFieldsModels = linkModel.related('linkFields');
                linkFieldsModels.models.forEach(function (model) {
                    fields.push(model.toJSON());
                });
            }

            htmlContent = documentsHandler.createDocumentContent(templateHtmlContent, fields, values);

            res.status(200).send({htmlContent : htmlContent});
        });
    };
};

module.exports = TemplatesHandler;