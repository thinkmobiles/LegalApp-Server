'use strict';

var express = require('express');
var router = express.Router();
var Attachments = require('../handlers/attachments');
var multer  = require('multer');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var attachments = new Attachments(PostGre);
    var session = new SessionHandler(PostGre);
    /*var storage = multer.diskStorage({
     destination: function (req, file, cb) {
     cb(null, process.env.AMAZON_S3_BUCKET)
     },
     filename: function (req, file, cb) {
     var userId = req.params.id;
     var avatarOrLogo = req.params.avatarOrLogo;
     var companyId = req.session.companyId || 1;

     if (avatarOrLogo === 'avatar') {
     cb(null, 'avatar_' + companyId + '_' +userId)
     } else {
     cb(null, 'logo_' + companyId)
     }
     //cb(null, file.fieldname + '-' + Date.now())
     }
     });*/
    /*var upload = multer({
        dest: process.env.AMAZON_S3_BUCKET,
        //storage:storage,
        *//*rename: function (fieldname, filename) {
            //return filename+Date.now();
            return filename;
        },*//*
        *//*destination: function (req, file, cb) {
            cb(null, process.env.AMAZON_S3_BUCKET)
        },*//*
        filename: function (req, file, cb) {
            var userId = req.params.id;
            var avatarOrLogo = req.params.avatarOrLogo;
            var companyId = req.session.companyId || 1;

            if (avatarOrLogo === 'avatar') {
                cb(null, 'avatar_' + companyId + '_' +userId)
            } else {
                cb(null, 'logo_' + companyId)
            }
            //cb(null, file.fieldname + '-' + Date.now())
        },
        onFileUploadStart: function (file) {
            console.log(file.originalname + ' is starting ...');
        },
        onFileUploadComplete: function (file) {
            console.log(file.fieldname + ' uploaded to  ' + file.path);
            global.done=true;
        }
    });*/

    //router.post('/', session.authenticatedUser, multipartMiddleware, attachments.getFile);
    router.post('/:id/:avatarOrLogo', multer({
        dest: process.env.AMAZON_S3_BUCKET,
        //storage:storage,
        rename: function (fieldname, filename, req, res) {
            var userId = req.params.id;
            var avatarOrLogo = req.params.avatarOrLogo;
            var companyId = req.session.companyId || 1;  // delete 1 from this line

            if (avatarOrLogo === 'avatar') {
                return 'avatar_' + companyId + '_' + userId;
            } else {
                return 'logo_' + companyId;
            }
         //return filename+Date.now();
         //return filename;
         },
         /*destination: function (req, file, cb) {
         cb(null, process.env.AMAZON_S3_BUCKET)
         },*/
        /*filename: function (req, file, cb) {
            var userId = req.params.id;
            var avatarOrLogo = req.params.avatarOrLogo;
            var companyId = req.session.companyId || 1;

            if (avatarOrLogo === 'avatar') {
                cb(null, 'avatar_' + companyId + '_' +userId)
            } else {
                cb(null, 'logo_' + companyId)
            }
            //cb(null, file.fieldname + '-' + Date.now())
        },*/
        onFileUploadStart: function (file) {
            console.log(file.name + ' is starting ...');
        },
        onFileUploadComplete: function (file) {
            console.log(file.name + ' uploaded to  ' + file.path);
        }
    }), attachments.getFile);
    //router.post('/:id/:avatarOrLogo', attachments.getFile);

    return router;
};