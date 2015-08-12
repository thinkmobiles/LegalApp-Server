'use strict';

var express = require('express');
var router = express.Router();
var DocumentsHandler = require('../handlers/documents');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var documentsHandler= new DocumentsHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', session.authenticatedUser, documentsHandler.newDocument); //todo check permissions...
    router.get('/', session.authenticatedUser, documentsHandler.getDocuments);
    router.get('/:id', session.authenticatedUser, documentsHandler.getDocument);
    router.put('/:id', session.authenticatedUser, documentsHandler.updateDocument);

    return router;
};