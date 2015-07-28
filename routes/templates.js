'use strict';

var express = require('express');
var router = express.Router();
var TemplateHandler = require('../handlers/templates');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var templates = new TemplateHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.get('/', session.authenticatedUser, templates.createTemplate);
    router.post('/', session.authenticatedUser, templates.getTemplates);  //TODO: check permissions
    router.get('/:id', session.authenticatedUser, templates.getTemplate);
    router.put('/:id', session.authenticatedUser, templates.updateTemplate); //TODO: check permissions
    router.delete('/:id', session.authenticatedUser, templates.removeTemplate); //TODO: check permissions

    return router;
};
