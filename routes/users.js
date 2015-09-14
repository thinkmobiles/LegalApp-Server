'use strict';

var express = require('express');
var router = express.Router();
var UserHandler = require('../handlers/users');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var users = new UserHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.get('/', session.authenticatedUser, users.getUsers);
    router.get('/search', session.authenticatedEditor, users.searchUsers);
    router.get('/count', session.authenticatedEditor, users.countUsers);
    router.post('/', session.authenticatedAdmin, users.inviteUser);
    router.get('/:id', session.authenticatedUser, users.getUsers);
    router.get('/:id/signature', session.authenticatedUser, users.getUserSignature);
    router.put('/:id', session.authenticatedAdmin, users.updateUser);
    router.post('/:id/accept', session.authenticatedAdmin, users.acceptUser);
    router.post('/:id/reject', session.authenticatedAdmin, users.rejectUser);

    return router;
};
