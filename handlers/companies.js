'use strict';

var CONSTANTS = require('../constants/index');
var PERMISSIONS = require('../constants/permissions');

var async = require('async');

var CompaniesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var CompanyModel = Models.Company;
    var UserCompanies = Models.UserCompanies;
    var self = this;
    
    this.createCompanyWithOwner = function (options, callback) {
        var userId = options.userId;
        var name = options.company;
        
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

};

module.exports = CompaniesHandler;