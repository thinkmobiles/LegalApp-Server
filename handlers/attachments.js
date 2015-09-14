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

var Attachments = function (PostGre) {
    var Models = PostGre.Models;
    var uploader = PostGre.Models.Image.uploader;
    var TemplateModel = Models.Template;
    var AttachmentModel = Models.Attachment;
    var self = this;

    function random(number) {
        return Math.floor((Math.random() * number));
    };

    function computeFileName(name, key) {
        return key + '_' + name;
    }

    function computeKey(name) {
        var ticks_ = new Date().valueOf();
        var key;

        if (name) {
            key = ticks_ + '_' + random(1000) + '_' + name;
        } else {
            key = ticks_ + '_' + random(1000);
        }

        return key;
    };

    this.computeKey = computeKey;

    this.computeFileName = computeFileName;

    this.getFile = function(req, res){
        if (!req.files.file){
            res.status(400).send('You do not choose the file.');
        } else {
             //if(global.done===true){
                console.log(req.files);
                res.status(201).send('File uploaded.');
            //};
        };
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
                var key = computeKey();
                var fileName = computeFileName(originalFilename, key);
                var uploadOptions = {
                    folderName: bucket,
                    fileName: fileName,
                    originalFileName: originalFilename,
                    buffer: buffer
                };

                if (process.env.NODE_ENV !== 'production') {
                    console.log('--- Upload file ----------------');
                    console.log(uploadOptions);
                    console.log('--------------------------------');
                }

                //uploader.uploadFile(bucket, fileName, buffer, function (err, fileName) {
                uploader.uploadFile(uploadOptions, function (err, uploadResult) {
                    if (err) {
                        return cb(err);
                    }
                    uploadResult.key = key;
                    uploadResult.originalFilename = originalFilename;
                    cb(null, uploadResult);
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

    this.saveAttachment = function (data, callback) {
        var attacheable_id;
        var attacheable_type;
        var name;
        var key;
        var saveData;

        if (!data) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: 'data'}));
            }
            return;
        }

        attacheable_id = data.attacheable_id;
        attacheable_type = data.attacheable_type;
        name = data.name;
        key = data.key;

        if (/*!attacheable_id || !attacheable_type ||*/ !name || !key) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['attacheable_type', 'attacheable_id', 'name', 'key']}));
            }
            return;
        }

        saveData = {
            name: name,
            key: key
        };

        if (data.id) {
            saveData.id = data.id; //update
        } //else - insert

        if (attacheable_id) {
            saveData.attacheable_id = attacheable_id;
        }

        if (attacheable_type) {
            saveData.attacheable_type = attacheable_type
        }

        /*console.log('>>> saveAttachments');
        console.log(saveData);*/

        AttachmentModel
            .upsert(saveData, function (err, attachmentModel) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, attachmentModel);
                }
            });
    };

};


module.exports = Attachments;
