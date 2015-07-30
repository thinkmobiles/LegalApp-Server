/**
 * Created by kille on 30.07.2015.
 */
'use strict';

var express = require('express');
var router = express.Router();
var DropBoxHandler = require('../handlers/dropBox');
//var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var dropBoxhandler = new DropBoxHandler(PostGre);
    //var session = new SessionHandler(PostGre);

    router.get('/',  dropBoxhandler.getAccountInfo);

    return router;
};