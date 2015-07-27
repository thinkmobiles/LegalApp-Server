/**
 * Created by kille on 23.07.2015.
 */
'use strict';

var fs = require('fs');

var Attachments = function () {

    this.getFile = function(req, res){
        if (!req.files.file){
            res.status(400).send('You do not choose the file.');
        } else {
             if(global.done==true){
                console.log(req.files);
                res.status(201).send('File uploaded.');
            };
        };
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
