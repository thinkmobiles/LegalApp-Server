'use strict';

var express = require('express');
var router = express.Router();
var FieldsHandler = require('../handlers/fields');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var fieldsHandler= new FieldsHandler(PostGre);
    var session = new SessionHandler(PostGre);

    //TODO: check middlewares for permmissions:
    router.get('/', session.authenticatedUser, fieldsHandler.getFields);
    router.get('/', session.authenticatedUser, fieldsHandler.getField);

    return router;
};