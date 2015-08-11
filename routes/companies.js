'use strict';

var express = require('express');
var router = express.Router();
var CompaniesHandler = require('../handlers/companies');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var companiesHandler= new CompaniesHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', /*session.authenticatedUser,*/ companiesHandler.newCompany); //todo check permissions...
    router.get('/', session.authenticatedAdmin, companiesHandler.getCompanies);

    return router;
};