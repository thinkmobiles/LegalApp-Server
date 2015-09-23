'use strict';

var express = require('express');
var router = express.Router();
//var DocumentsHandler = require('../handlers/documents');
var DocumentsHandler = require('../handlers/documentsNew');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var documentsHandler= new DocumentsHandler(PostGre);
    var session = new SessionHandler(PostGre);

    //router.post('/', session.authenticatedEditor, documentsHandler.newDocument);
    router.post('/test', session.authenticatedEditor, documentsHandler.testKnex);
    router.post('/', session.authenticatedEditor, documentsHandler.newDocument);
    router.get('/', session.authenticatedUser, documentsHandler.getDocuments);
    router.get('/list', session.authenticatedUser, documentsHandler.getDocumentsByTemplates);
    router.get('/list/:templateId', session.authenticatedUser, documentsHandler.getDocumentsByTemplate);

    router.get('/signature', session.authenticatedUser, documentsHandler.validateDocumentBySecretKey);
    router.post('/signature', documentsHandler.saveEncryptedDataToDocument); //TODO: delete this in future, for testing

    router.get('/:id', session.authenticatedUser, documentsHandler.getDocument);
    router.put('/:id', session.authenticatedEditor, documentsHandler.updateDocument);
    router.patch('/:id', session.authenticatedEditor, documentsHandler.updateDocument);
    router.post('/signAndSend', session.authenticatedEditor, documentsHandler.companiesSignatureMiddleware, documentsHandler.createSignAndSend); //TODO: dublicate, not used now
    router.post('/:id/signAndSend', session.authenticatedEditor, documentsHandler.signAndSend);
    router.get('/:id/preview', session.authenticatedUser, documentsHandler.previewDocument);
    router.get('/:id/send', session.authenticatedUser, documentsHandler.sendDocumentToSign);
    router.get('/:token/signature', session.authenticatedUser, documentsHandler.getTheDocumentToSign);
    router.post('/:token/signature', session.authenticatedUser, documentsHandler.companiesSignatureMiddleware, documentsHandler.addSignatureToDocument);

    return router;
};