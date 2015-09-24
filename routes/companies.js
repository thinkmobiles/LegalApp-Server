'use strict';

var express = require('express');
var router = express.Router();
var CompaniesHandler = require('../handlers/companies');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var companiesHandler= new CompaniesHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', session.authenticatedAdmin, companiesHandler.newCompany); //todo check permissions...
    router.get('/', session.authenticatedAdminsEditors, companiesHandler.getCompanies);
    router.get('/getList',session.authenticatedUser, companiesHandler.getAllCompanies);
    router.get('/:id', session.authenticatedUser, companiesHandler.getCompany); //todo check permissions...
    router.put('/:id', session.authenticatedUser, companiesHandler.updateCompany);


    return router;
};