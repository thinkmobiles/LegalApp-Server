'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

var async = require('async');
var badRequests = require('../helpers/badRequests');

var SessionHandler = require('../handlers/sessions');

var EmployeeHandler = function (PostGre) {
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var EmployeeModel = Models.Employee;
    var UserModel = Models.User;
    var session = new SessionHandler(PostGre);
    var self = this;

    function prepareSaveData(params) {
        var params = params || {};
        var email = params.email;
        var firstName = params.first_name;
        var lastName = params.last_name;
        var saveData = {};

        if (email) {
            saveData.email = email;
        }
        if (firstName) {
            saveData.first_name = firstName;
        }
        if (lastName) {
            saveData.last_name = lastName;
        }

        return saveData;
    };

    this.newEmployee = function (req, res, next) {
        var companyId = req.session.companyId;
        var options = req.body;
        var saveData = prepareSaveData(options);
        var email = saveData.email;

        if (Object.keys(saveData).length !== 3) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'first_name', 'last_name']}));
        }

        if (!EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        saveData.company_id = companyId;

        knex(TABLES.EMPLOYEES)
            .where('email', email)
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }

                if (rows && rows.length) {
                    return next(badRequests.EmailInUse());
                }

                EmployeeModel
                    .forge()
                    .save(saveData)
                    .exec(function (err, employeeModel) {
                        if (err) {
                            return next(err);
                        }
                        res.status(201).send({success: 'created', model: employeeModel});
                    });
            });
    };

    this.searchEmployees = function (req, res, next) {
        var EMPLOYEES = TABLES.EMPLOYEES;
        var COMPANIES = TABLES.COMPANIES;
        var companyId = req.session.companyId;
        var params = req.query;
        var searchTerm = params.value;
        var page = params.page || 1;
        var limit = params.count || 20;
        var orderBy = params.orderBy || 'value';
        var order = params.order || 'ASC';
        var columns = [
            EMPLOYEES + '.id',
            EMPLOYEES + '.email',
            EMPLOYEES + '.first_name',
            EMPLOYEES + '.last_name',
            COMPANIES + '.id as company_id',
            COMPANIES + '.name as company_name',
            knex.raw(
                "CONCAT(" + EMPLOYEES + ".first_name, ' ', " + EMPLOYEES + ".last_name) AS value"
            )
        ];

        var query = knex(EMPLOYEES)
            .innerJoin(COMPANIES, COMPANIES + '.id', EMPLOYEES + '.company_id');

        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            query.whereRaw(
                "LOWER(first_name) LIKE '%" + searchTerm + "%' "
                + "OR LOWER(last_name) LIKE '%" + searchTerm + "%' "
                + "OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%" + searchTerm + "%' "
            );
        }

        if (!session.isAdmin(req)) {
            query.andWhere(TABLES.COMPANIES + '.id', companyId);
        }

        query
            .select(columns)
            .offset(( page - 1 ) * limit)
            .limit(limit)
            .orderBy(orderBy, order)
            .exec(function (err, rows) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(rows);
            });
    };

    this.updateEmployee = function (req, res, next) {
        var employeeId = req.params.id;
        var companyId = req.session.companyId;
        var options = req.body;
        var email = options.email;
        var criteria = {
            id: employeeId
        };
        var saveData = prepareSaveData(options);


        // is valid email:
        if (email && !EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        // is any data to update:
        if (!Object.keys(saveData).length) {
            return next(badRequests.NotEnParams({message: 'No parameters for update'}));
        }

        // check company scope:
        if (!session.isAdmin(req)) {
            criteria.company_id = companyId;
        }

        EmployeeModel
            .forge(criteria)
            .save(saveData, {patch: true})
            .then(function (employeeModel){
                res.status(200).send({success: 'updated'});
            })
            .catch(EmployeeModel.NotFoundError, function (err) {
                next(badRequests.NotFound({message: 'Employee was not found'}));
            })
            .catch(function(err) {
                if (err.message && (err.message.indexOf('No rows were affected in the update') !== -1)) {
                    return next(badRequests.NotFound({message: 'Employee was not found'}));
                }
                next(err);
            });
    };

};

module.exports = EmployeeHandler;