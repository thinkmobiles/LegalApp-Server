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
var AttachmentHandler = require('../handlers/attachments');
var DocumentsHandler = require('../handlers/documents');

var TemplatesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var uploader = PostGre.Models.Image.uploader;
    var TemplateModel = Models.Template;
    var AttachmentModel = Models.Attachment;
    var LinkedTemplatesModel = Models.LinkedTemplates;
    var session = new SessionHandler(PostGre);
    var attachments = new AttachmentHandler(PostGre);
    var documentsHandler = new DocumentsHandler(PostGre);
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

        mammoth
            .convertToHtml(converterParams)
            .then(function (result) {
                var messages = result.messages; // Any messages, such as warnings during conversion
                var htmlContent;

                if (messages && messages.length) {
                    console.error(messages);
                }

                htmlContent = result.value; // The generated HTML

                res.send(htmlContent);
            })
            .done();

        //res.send('OK');
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
        var hasLinkedTemplate = false;
        var linkedTemplatesArray;
        var description;

        if (!name || !linkId || !templateFile) {
            return next(badRequests.NotEnParams({reqParams: ['name', 'link_id', 'templateFile']}));
        }

        if (options.linked_templates && options.linked_templates.length) {
            hasLinkedTemplate = true;
            linkedTemplatesArray = options.linked_templates;
        }

        if (options.description && options.description.length) {
            description = options.description;
        }

        originalFilename = templateFile.originalFilename;
        extension = originalFilename.slice(-4);

        if (extension !== 'docx') {
            return next(badRequests.InvalidValue({message: 'Incorrect file type'}));
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

                mammoth
                    .convertToHtml(converterParams)
                    .then(function (result) {
                        var messages = result.messages; // Any messages, such as warnings during conversion

                        if (messages && messages.length) {
                            console.error(messages);
                        }

                        htmlContent = result.value; // The generated HTML

                        cb(null, key, htmlContent);
                    })
                    .done();
            },

            //insert into templates:
            function (key, htmlContent, cb) {
                var saveData = {
                    name: name,
                    link_id: linkId,
                    company_id: companyId,
                    html_content: htmlContent,
                    has_linked_template: hasLinkedTemplate,
                    description: description
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

            //save linkedTemplates
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
                    })

            }

        ], function (err, templateModel) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: MESSAGES.SUCCESS_CREATED_TEMPLATE, model: templateModel});
        });
    };

    this.getTemplates = function (req, res, next) {
        var companyId = req.session.companyId;

        TemplateModel
            .forge()
            .query(function (qb) {
                qb.where({company_id: companyId});
            })
            .fetchAll()
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

    this.previewDocument = function (req, res, next) {
        var templateId = req.params.id;
        var options = req.body;
        var values;
        var criteria = {
            id: templateId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['link.linkFields']
        };

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        } else {
            return next(badRequests.NotEnParams('values'));
        }

        TemplateModel
            .find(criteria, fetchOptions)
            .then(function (templateModel) {
                var templateHtmlContent = templateModel.get('html_content');
                var linkModel = templateModel.related('link');
                var fields = [];
                var htmlContent;
                var linkFieldsModels;

                if (linkModel && linkModel.related('linkFields')) {
                    linkFieldsModels = linkModel.related('linkFields');
                    linkFieldsModels.models.forEach(function (model) {
                        fields.push(model.toJSON());
                    });
                }

                if (values && templateHtmlContent) {
                    htmlContent = documentsHandler.createDocumentContent(templateHtmlContent, fields, values);
                } else {
                    htmlContent = '';
                }

                res.status(200).send({htmlContent : htmlContent});
            })
            .catch(TemplateModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

};

module.exports = TemplatesHandler;