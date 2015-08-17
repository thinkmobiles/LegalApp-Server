'use strict';

var CONSTANTS = require('../constants/index');
var PERMISSIONS = require('../constants/permissions');
var TABLES = require('../constants/tables');

var async = require('async');
var badRequests = require('../helpers/badRequests');

var CompaniesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var CompanyModel = Models.Company;
    var UserCompanies = Models.UserCompanies;
    var self = this;
    
    this.createCompanyWithOwner = function (options, callback) {
        var userId = options.userId;
        var name = options.name || options.company; //TODO: !!!;
        
        //TODO: validate incom. params
        
        async.waterfall([
        
            //create a new company:
            function (cb) {
                var createData = {
                    owner_id: userId,
                    name: options.name
                };

                CompanyModel
                    .forge(createData)
                    .save()
                    .exec(function (err, companyModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, companyModel);
                     }); 
            },

            //insert into user_companies:
            function (companyModel, cb) {
                var createData = {
                    companyId: companyModel.id,
                    userId: userId
                };

                self.insertIntoUserCompanies(createData, function (err, model) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, companyModel);
                    }); 
            }

        ], function (err, companyModel) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, companyModel);
                }
            }
        });
    };

    this.insertIntoUserCompanies = function (options, callback) {
        var companyId = options.companyId;
        var userId = options.userId;
        var createData = {
            company_id: companyId,
            user_id: userId
        };

        UserCompanies
            .forge(createData)
            .save()
            .exec(function (err, model) {
                if (err) {
                    if (callback && (typeof callback === 'function')) {
                        callback(err);
                    }
                } else {
                    if (callback && (typeof callback === 'function')) {
                        callback(null, model);
                    }
                }
            });
    };

    this.newCompany = function (req, res, next) {
        var userId = req.session.userId || 1; //TODO: !!!
        var options = req.body;
        var name = options.name;
        var createOptions = {
            //userId: userId,
            name: name
        };

        if (!name) {
            return next(badRequests.NotEnParams({reqParams: ['name']}));
        }

        CompanyModel
            .forge()
            .save(createOptions)
            .exec(function (err, companyModel) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({success: 'created', model: companyModel});
            });
    };

    this.getCompanies = function (req, res, next) {
        var options = req.query;
        var searchTerm = options.search;
        var page = req.query.page || 1;
        var limit = req.query.count || 10;

        CompanyModel
            .forge()
            .query(function (qb) {
                if (searchTerm) {
                    searchTerm = searchTerm.toLowerCase();
                    qb.whereRaw(
                        "LOWER(name) LIKE '%" + searchTerm + "%' "
                    );
                }
                qb.offset(( page - 1 ) * limit)
                    .limit(limit);
            })
            .fetchAll()
            .then(function (rows) {
                res.status(200).send(rows);
            })
            .catch(next);
    };
};

module.exports = CompaniesHandler;