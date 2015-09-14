'use strict';

var express = require('express');
var router = express.Router();
var TemplateHandler = require('../handlers/templates');
var SessionHandler = require('../handlers/sessions');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var templates = new TemplateHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', session.authenticatedAdminsEditors, multipartMiddleware, templates.createTemplate);
    router.get('/', session.authenticatedUser, templates.getTemplates);
    router.get('/:id', session.authenticatedUser, templates.getTemplate);
    router.put('/:id', session.authenticatedAdminsEditors, multipartMiddleware, templates.updateTemplate);
    router.delete('/:id', session.authenticatedAdminsEditors, templates.removeTemplate);
    router.get('/:id/preview', session.authenticatedUser, templates.previewTemplate);
    router.post('/:id/previewDocument', session.authenticatedUser, templates.previewDocument);
    router.post('/docx2html', session.authenticatedEditor, multipartMiddleware, templates.docx2html);

    return router;
};
