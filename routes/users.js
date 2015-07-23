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
    router.put('/:id', session.authenticatedAdmin, users.updateUser);
    return router;
};
