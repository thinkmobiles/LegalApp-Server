'use strict';

var express = require('express');
var router = express.Router();
var EmployeeHandler = require('../handlers/employees');
var SessionHandler = require('../handlers/sessions');

module.exports = function (app) {
    var PostGre = app.get('PostGre');
    var employees = new EmployeeHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.post('/', session.authenticatedUser, employees.newEmployee);
    router.get('/search', session.authenticatedUser, employees.searchEmployees);
    router.put('/:id', session.authenticatedUser, employees.updateEmployee);

    return router;
};
