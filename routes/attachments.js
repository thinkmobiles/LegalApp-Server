/**
 * Created by kille on 23.07.2015.
 */
'use strict';

var express = require('express');
var router = express.Router();
var Attachments = require('../handlers/attachments');
//var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var attachments = new Attachments();
    //var session = new SessionHandler(PostGre);

    //router.post('/', session.authenticatedUser, multipartMiddleware, attachments.getFile);
    router.post('/', attachments.getFile);

    return router;
};