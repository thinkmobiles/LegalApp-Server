'use strict';

var express = require('express');
var router = express.Router();
var Messages = require('../handlers/messages');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var messages = new Messages(PostGre);
    var session = new SessionHandler(PostGre);


    //router.post('/:id/:avatarOrLogo', attachments.getFile);
    //router.post('/:id/:avatarOrLogo', attachments.getFile);

    router.get('/', session.authenticatedUser, messages.getMessagesAdmins);
    router.patch('/:id', session.authenticatedUser, messages.changeIsCompleted);

    return router;
};