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
    router.get('/search', session.authenticatedAdmin, users.searchUsers);
    router.post('/', session.authenticatedAdmin, users.inviteUser);
    router.get('/:id', session.authenticatedUser, users.getUser);
    router.put('/:id', session.authenticatedAdmin, users.updateUser);

    return router;
};
