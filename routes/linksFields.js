/**
 * Created by kille on 27.07.2015.
 */
'use strict';

var express = require('express');
var router = express.Router();
var LinksFieldsHandler = require('../handlers/linksFields');
//var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var linksFieldsHandler = new LinksFieldsHandler(PostGre);
    //var session = new SessionHandler(PostGre);

    router.post('/', linksFieldsHandler.createLinksFields);
    //router.get('/', linksFieldsHandler.getLinksFields);
    router.get('/:id', linksFieldsHandler.getLinksFieldsById);
    //router.delete('/:id', linksFieldsHandler.removeLink);

    return router;
};