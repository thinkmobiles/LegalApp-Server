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

    function prepareData(saveData) {
        var saveOptions = {};

        if (saveData && saveData.name) {
            saveOptions.name = saveData.name;
        }
        if (saveData && saveData.email) {
            saveOptions.email = saveData.email;
        }
        if (saveData && saveData.country) {
            saveOptions.country = saveData.country;
        }
        if (saveData && saveData.city) {
            saveOptions.city = saveData.city;
        }
        if (saveData && saveData.address) {
            saveOptions.address = saveData.address;
        }

        return saveOptions;
    }

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
        var createOptions;

        createOptions = prepareData(options);

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

    this.getAllCompanies = function (req, res, next) {
        var permissions = req.session.permissions;
        var companyId = req.session.companyId;
        var queryOptions;

        if (!((permissions === PERMISSIONS.SUPER_ADMIN) || (permissions === PERMISSIONS.ADMIN))) {
            queryOptions = {
                id: companyId
            };
        }

        CompanyModel
            .forge()
            .query(function (qb) {
                if (queryOptions) {
                    qb.where(queryOptions);
                }
            })
            .fetchAll()
            .then(function (companiesModels) {
                res.status(200).send(companiesModels);
            })
            .catch(next)
    };

    this.updateCompany = function (req, res, next) {
        var updateCompanyId = req.params.id;
        var permissions = req.session.permissions;
        var companyId = req.session.companyId;
        var options = req.body;
        var saveData;

        if ((permissions === PERMISSIONS.SUPER_ADMIN) ||
            (permissions === PERMISSIONS.ADMIN) ||
            ((permissions === PERMISSIONS.CLIENT_ADMIN) && (updateCompanyId === companyId))) {

            saveData = prepareData(options);
        } else {
            return next(badRequests.AccessError());
        }

        CompanyModel
            .forge({id: updateCompanyId})
            .save(saveData, {patch: true})
            .exec(function (err, companyModel) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({success: 'updated', model: companyModel});
            });
    };
};

module.exports = CompaniesHandler;