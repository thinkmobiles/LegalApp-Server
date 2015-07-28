/**
 * Created by kille on 24.07.2015.
 */
'use strict';

var express = require('express');
var router = express.Router();
var LinksHandler = require('../handlers/links');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var linkshandler = new LinksHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', linkshandler.createLink);
    router.put('/:id', session.authenticatedUser, linkshandler.updateLink);
    router.get('/', session.authenticatedUser, linkshandler.getLinks);
    router.get('/:id', session.authenticatedUser, linkshandler.getLink);
    router.delete('/:id', session.authenticatedUser, linkshandler.removeLink);

    return router;
};