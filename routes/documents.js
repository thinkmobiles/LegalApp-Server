'use strict';

var express = require('express');
var router = express.Router();
var DocumentsHandler = require('../handlers/documents');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var documentsHandler= new DocumentsHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', session.authenticatedEditor, documentsHandler.newDocument);
    router.get('/', session.authenticatedUser, documentsHandler.getDocuments);
    router.get('/list', session.authenticatedUser, documentsHandler.getDocumentsByTemplates);
    router.get('/list/:templateId', session.authenticatedUser, documentsHandler.getDocumentsByTemplate);

    router.get('/signature', documentsHandler.validateDocumentBySecretKey);
    router.post('/signature', documentsHandler.saveEncryptedDataToDocument);

    router.get('/:id', session.authenticatedUser, documentsHandler.getDocument);
    router.put('/:id', session.authenticatedEditor, documentsHandler.updateDocument);
    router.get('/:id/preview', session.authenticatedUser, documentsHandler.previewDocument);
    router.get('/:id/send', session.authenticatedUser, documentsHandler.sendDocumentToSign);
    router.get('/:token/signature', session.authenticatedUser, documentsHandler.getTheDocumentToSign);
    router.post('/:token/signature', session.authenticatedUser, documentsHandler.addSignatureToDocument);


    return router;
};