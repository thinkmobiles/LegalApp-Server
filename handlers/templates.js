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

    function getCssForTemplates(callback) {
        fs.readFile(CONSTANTS.PDF_CSS_PATH, function (err, content) {
            if (err) {
                return callback(err);
            }
            callback(null, content);
        });
    };

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
                getCssForTemplates(function (err, content) {
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

        mammothHandler.docx2html(converterParams, function (htmlContent) {
            if (!htmlContent) {
                return next(badRequests.InvalidValue({message: 'Nothing for convertation'}))
            }
            res.send(htmlContent);
        });
    };

    this.prepareSaveData = function (params) {
        var saveData = {};

        if (!params) {
            return false;
        }

        if (params.name) {
            saveData.name = params.name;
        }

        if (params.description !== undefined) {
            saveData.description = params.description;
        }

        if (params.link_id) {
            saveData.link_id = params.link_id;
        }

        if (params.linked_templates !== undefined) {
            if (params.linked_templates.length) {
                saveData.has_linked_template = true;
            } else {
                saveData.has_linked_template = false;
            }
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
                attachments.saveTheTemplateFile(templateFile, function (err, uploadResult) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, uploadResult);
                });
            },

            //convert docx to html:
            function (uploadResult, cb) {
                var bucket = BUCKETS.TEMPLATE_FILES;
                var filePath = uploadResult.filePath;
                var htmlContent = '';
                var converterParams = {
                    path: filePath
                };

                mammothHandler.docx2html(converterParams, function (htmlContent) {
                    if (!htmlContent) {
                        return next(badRequests.InvalidValue({message: 'Nothing for convertation'}))
                    }
                    cb(null, uploadResult, htmlContent);
                });
            },

            //get linked template if need:
            function (uploadResult, htmlContent, cb) {
                if (!hasLinkedTemplate) {
                    return cb(null, uploadResult, htmlContent);
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
            function (uploadResult, htmlContent, cb) {
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
                        cb(null, templateModel, uploadResult);
                    });
            },

            //save into attachments:
            function (templateModel, uploadResult, cb) {
                var saveData = {
                    attacheable_type: BUCKETS.TEMPLATE_FILES,
                    attacheable_id: templateModel.id,
                    name: uploadResult.originalFilename,
                    key: uploadResult.key
                };

                attachments.saveAttachment(saveData, function (err, attachmentModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, templateModel);
                });
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
        var templateModel = new TemplateModel();

        templateModel.getFullTemplate(function (err, result) {
            if (err) {
                return next(err)
            }
            res.status(200).send(result)
        })
    };

    this.getTemplate = function (req, res, next) {
        /*var templateId = req.params.id;
        var templateModel = new TemplateModel();
        var criteria = {
            id: templateId
        };

        templateModel.getFullTemplate(criteria, function (err, result) {
            if (err) {
                return next(err)
            }
            res.status(200).send(result)
        });*/

        var templateId = req.params.id;
        var criteria = {
            id: templateId
        };
        var fetchParams = {
            require: true,
            withRelated: ['link.linkFields', 'templateFile', 'linkedTemplates']
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

    this.getTopTemplates = function (req, res, next) {
        var TEMPLATES = TABLES.TEMPLATES;
        var DOCUMENTS = TABLES.DOCUMENTS;
        var params = req.query;
        var page = params.page || 1;
        var limit = params.count || 12;
        var fields = [
            TEMPLATES + '.id',
            TEMPLATES + '.name'
        ];

        var query = knex(TEMPLATES)
            .leftJoin(DOCUMENTS, TEMPLATES + '.id', DOCUMENTS + '.template_id')
            .count(TEMPLATES + '.id')
            .groupBy(TEMPLATES + '.id')
            .select(fields)
            .orderBy('count', 'DESC')
            .offset(( page - 1 ) * limit)
            .limit(limit)
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(rows);
            });
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

    function updateLinkedTemplates(options, callback) {
        console.log('updateLinkedTemplates');
        var templateId = options.templateId;
        var linkedId = options.linkedId;
        var criteria = {
            template_id: templateId
        };
        var saveData = {
            linked_id: linkedId
        };

        LinkedTemplatesModel
            .forge()
            .query(function (qb) {
                qb.where(criteria);
            })
            .fetch()
            .exec(function (err, linkedTemplateModel) {
                var model;

                if (err) {
                    return callback(err);
                }

                if (linkedTemplateModel) {
                    model = linkedTemplateModel
                } else {
                    model = LinkedTemplatesModel.forge(criteria);
                }

                model
                    .save(saveData)
                    .exec(function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, result);
                    });
            });
    };

    function removeLinkedTemplates(options, callback) {
        console.log('removeLinkedTemplates');
        var templateId = options.templateId;
        var criteria = {
            template_id: templateId
        };

        knex(TABLES.LINKED_TEMPLATES)
            .where(criteria)
            .del()
            .exec(function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
    }

    this.updateTemplate = function (req, res, next) {
        var options = req.body;
        var templateId = req.params.id;
        var permissions = req.session.permissions;
        var templateFile = req.files.templateFile;
        var linkedTemplates = options.linked_templates;
        var originalFilename;
        var extension;
        var templateSaveData;

        console.log(options);

        if (!(permissions === PERMISSIONS.SUPER_ADMIN) && !(permissions === PERMISSIONS.ADMIN) && !(permissions === PERMISSIONS.EDITOR)) {
            return next(badRequests.AccessError());
        }

        templateSaveData = self.prepareSaveData(options);

        if (templateFile) {
            originalFilename = templateFile.originalFilename;
            extension = originalFilename.slice(-4);

            if (extension !== 'docx') {
                return next(badRequests.InvalidValue({message: 'Incorrect file type'}));
            }
        }

        if (!Object.keys(templateSaveData).length && !templateFile) {
            return next(badRequests.NotEnParams({message: 'Nothing to update'}));
        }

        async.parallel({

            // find the template model:
            templateModel: function (cb) {

                TemplateModel
                    .forge({
                        id: templateId
                    })
                    .fetch({require: true})
                    .then(function (templateModel) {
                        cb(null, templateModel);
                    })
                    .catch(TemplateModel.NotFoundError, function (err) {
                        cb(badRequests.NotFound({message: 'Template was not found'}));
                    })
                    .catch(cb);
            },

            // find lined templates:
            linkedTemplates: function (cb) {
                var updateOptions;
                var updateMethod;

                if (linkedTemplates === undefined) {
                    return cb();
                }

                if (linkedTemplates.length) {
                    updateOptions = {
                        templateId: templateId,
                        linkedId: linkedTemplates[0]
                    };
                    updateMethod = updateLinkedTemplates;
                } else {
                    updateOptions = {
                        templateId : templateId
                    };
                    updateMethod = removeLinkedTemplates;
                }


                updateMethod(updateOptions, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, result);
                });
            },

            // find the attachment:
            attachmentModels: function (cb) {
                if (!templateFile) {
                    return cb();
                }

                knex(TABLES.ATTACHMENTS)
                    .where({
                        attacheable_type: TABLES.TEMPLATES,
                        attacheable_id: templateId
                    })
                    .select(['id', 'name', 'key'])
                    .exec(function (err, rows) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, rows);
                    });
            },

            //save the docx file if need:
            uploadResult: function (cb) {
                if (!templateFile) {
                    return cb(null, null);
                }

                attachments.saveTheTemplateFile(templateFile, function (err, uploadResult) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, uploadResult);
                });
            }

        }, function (err, models) {
            var templateModel;
            var uploadResult;
            var attachmentModels;
            var linkedTemplates;

            if (err) {
                return next(err);
            }

            templateModel = models.templateModel;
            uploadResult = models.uploadResult;
            attachmentModels = models.attachmentModels;
            linkedTemplates = models.linkedTemplates;

            //res.status(200).send({success: 'Success updated', model: models.templateModel, models: models});
            async.waterfall([

                //convert docx to html:
                function (cb) {
                    var bucket = BUCKETS.TEMPLATE_FILES;
                    var filePath;
                    var converterParams;

                    if (!templateFile) {
                        return cb(null, null, null);
                    }

                    filePath = uploadResult.filePath;
                    converterParams = {
                        path: filePath
                    };

                    mammothHandler.docx2html(converterParams, function (htmlContent) {
                        if (!htmlContent) {
                            return next(badRequests.InvalidValue({message: 'Nothing for convertation'}))
                        }
                        cb(null, htmlContent, uploadResult);
                    });
                },

                //update attachments:
                function (htmlContent, uploadResult, cb) {
                    var saveData;

                    if (!uploadResult) {
                        return cb(null, htmlContent);
                    }

                    saveData = {
                        name: uploadResult.originalFilename,
                        key: uploadResult.key
                    };

                    if (attachmentModels && attachmentModels.length) {
                        saveData.id = attachmentModels[0].id;
                    } else {
                        saveData.attacheable_id = templateId;
                        saveData.attacheable_type = BUCKETS.TEMPLATE_FILES
                    }

                    attachments.saveAttachment(saveData, function (err, updatedAttachmentModel) {
                        var bucket = BUCKETS.TEMPLATE_FILES;
                        var attachment;
                        var oldName;
                        var oldKey;
                        var oldFileName;
                        var removeOptions;

                        if (err) {
                            return cb(err);
                        }

                        //remove the old docx file:
                        if (attachmentModels && attachmentModels.length) {
                            attachment = attachmentModels[0];
                            oldName = attachment.name;
                            oldKey = attachment.key;
                            oldFileName = attachments.computeFileName(oldName, oldKey);
                            removeOptions = {
                                fileName: oldFileName,
                                folderName: bucket
                            };
                            uploader.removeFile(removeOptions, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                            });
                        }

                        cb(null, htmlContent);
                    });
                },

                // update the templateModel:
                function (htmlContent, cb) {
                    if (htmlContent) {
                        templateSaveData.html_content = htmlContent;
                    }

                    templateModel
                        .save(templateSaveData, {patch: true})
                        .exec(function (err, savedTemplateModel) {
                            if (err) {
                                return cb(err);
                            }
                            cb(null, savedTemplateModel);
                        });
                }

            ], function (err, templateModel) {
                if (err) {
                    return next(err);
                }
                res.status(200).send({success: 'Success updated', model: templateModel/*, models: models*/});
            });
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

        var values;

        if (options.values && (typeof options.values === 'object') && Object.keys(options.values).length) {
            values = options.values;
        } else {
            return next(badRequests.NotEnParams({reqParams: 'values'}));
        }

        async.parallel({

            templateModel: function (cb) {
                var templateOptions = {
                    templateId: templateId
                };

                documentsHandler.getTemplateModelWithLinks(templateOptions, function (err, templateModel) {
                    if (err) {
                        return next(err);
                    }
                    cb(null, templateModel);
                });
            },

            cssContent: function (cb) {
                getCssForTemplates(function (err, content) {
                    if (err) {
                        return next(err);
                    }
                    cb(null, content);
                });
            }

        }, function (err, results) {
            var templateModel;
            var cssContent;
            var templateHtmlContent;
            var linkModel;
            var linkFieldModels;
            var fields;
            var htmlContent;

            if (err) {
                return next(err);
            }

            templateModel = results.templateModel;
            cssContent = results.cssContent;

            templateHtmlContent = templateModel.get('html_content');
            linkModel = templateModel.related('link');
            fields = [];

            if (linkModel && linkModel.related('linkFields')) {
                linkFieldModels = linkModel.related('linkFields');
                linkFieldModels.models.forEach(function (model) {
                    fields.push(model.toJSON());
                });
            }

            htmlContent = documentsHandler.createDocumentContent(templateHtmlContent, fields, values);
            htmlContent = '<style>' + cssContent + '</style>' + htmlContent;

            res.status(200).send({htmlContent: htmlContent});

        });

        /*documentsHandler.getTemplateModelWithLinks(templateOptions, function (err, templateModel) {
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

            res.status(200).send({htmlContent: htmlContent});
        });*/
    };
};

module.exports = TemplatesHandler;