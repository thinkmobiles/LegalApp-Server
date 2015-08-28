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

    function computeKey(name) {
        var ticks_ = new Date().valueOf();
        var key;

        key = ticks_ + '_' + random(1000) + '_' + name;

        return key;
    };

    this.computeKey = computeKey;

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
                    name: key //looks like: 1439330842375_121_myFileName.docx
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

        if (!attacheable_id || !attacheable_type || !name || !key) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['attacheable_type', 'attacheable_id', 'name', 'key']}));
            }
            return;
        }

        saveData = {
            attacheable_type: attacheable_type,
            attacheable_id: attacheable_id,
            name: name,
            key: key
        };

        AttachmentModel
            .upsert(saveData, function (err, attachmentModel) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, attachmentModel);
                }
            });
    };

    //var key;
    //var ImageFileSystem = require('../helpers/imageUploader/imageFileSystem.js');

    /*function random(number) {
        return Math.floor((Math.random() * number));
    }

    function computeKey(name, ticks) {
        var name_ = name || CONSTANTS.DEFAULT_FILE_NAME;
        var ticks_ = ticks || new Date().valueOf();

        key = name_ + '_' + ticks_ + '_' + random(1000);

        return key;
    };*/

    /*this.getFile = function (req, res, callback) {
        //var bucket = process.env.FILES_BUCKET;
        var srcpath = req.files.file.path;
        var dstpath = process.env.AMAZON_S3_BUCKET;
*/

        /*var bucket = process.env.AMAZON_S3_BUCKET;
        var imageData = req.body.avatar;
        var directory = 'avatars';
        var src  = req.files.file.path;
        var name = req.body.originalName;
        var imageFileSystem = new ImageFileSystem(bucket);
        key = computeKey(name);*/


        /*imageFileSystem.uploadImage(imageData, name, directory, function (err, fileName) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, key);
                }
            }
        });*/

   // };


};


module.exports = Attachments;
