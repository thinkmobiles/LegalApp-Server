var express = require('express');
var router = express.Router();
//var UserHandler = require('../handlers/users');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    'use strict';
    var postGre = app.get('PostGre');
    //var users = new UserHandler(postGre);
    var session = new SessionHandler(postGre);

    return router;
};
