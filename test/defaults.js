'use strict';

var TABLES = require('../constants/tables');
var PERMISSOINS = require('../constants/permissions');

var async = require('async');
var crypto = require('crypto');
var PASSWORD = '123456';

module.exports = function (db) {
    var factory = require('./factory')(db);
    var Models = db.Models;
    var Collections = db.Collections;
    var User = Models.User;
    var Profile = Models.Profile;

    var defaultData = {};
    
    var users = [{
            email: 'user1@mail.com'
        }, {
            email: 'user2@mail.com'
            }, {
            email: 'unconfirmed@mail.com',
            confirm_token: 'unconfirmed_user'
        }];
    
    var profiles = [{
            first_name: 'user',
            last_name: '1',
            permissions: PERMISSOINS.OWNER
        }, {
            first_name: 'user',
            last_name: '2',
            permissions: PERMISSOINS.OWNER
        }, {
            first_name: 'unconfirmed',
            last_name: 'user'
        }];

    var userCompanies = [{
            user_id: 1,
            company_id: 1
        }, {
            user_id: 2,
            company_id: 2
        }, {
            user_id: 3,
            company_id: 1
        }, {
            user_id: 4,
            company_id: 1
        }, {
            user_id: 5,
            company_id: 1
        }];

    function create(callback) {
        async.waterfall([
            
            //create users:
            function (cb) {
                factory.createMany(TABLES.USERS, users, 5, function (err, users) {
                    defaultData.users = users;
                    cb(err, users);
                });
            },

            //create profiles:
            function (userModels, cb) {
                var count = userModels.length;

                factory.createMany(TABLES.PROFILES, profiles, count, function (err, profiles) {
                    if (err) {
                        return cb(err);
                    }

                    userModels.map(function (userModel, index) {
                        var profileModel = profiles[index];
                        userModel.set('profile', profileModel);
                    });
                    
                    cb();
                });
            },

            //companies:
            function (cb) {
                factory.createMany(TABLES.COMPANIES, 2, function (err, companies) {
                    if (err) return cb(err);
                    defaultData.companies = companies;
                    cb();
                });
            },

            //user_companies:
            function (cb) {
                factory.createMany(TABLES.USER_COMPANIES, userCompanies, function (err, companies) {
                    if (err) return cb(err);
                    defaultData.userCompanies = userCompanies;
                    cb();
                });
            }

        ], function (err) {
            if (err) { 
                return callback(err);
            }
            callback();
        });
    };
    
    function getData(table) {
        if (table && defaultData[table]) {
            return defaultData[table];
        } else {
            return defaultData;
        }
    }

    return {
        create: create,
        getData: getData,
        password: PASSWORD
    }
};