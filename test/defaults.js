'use strict';

var TABLES = require('../constants/tables');

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
            function (users, cb) {
                async.eachSeries(users, 
                    function (userModel, eachCb) {
                        var profile = {
                            user_id: userModel.id
                        };
                    
                        factory.create(TABLES.PROFILES, profile, function (err, profileModel) {
                            if (err) {
                                return eachCb(err);
                            }
                            userModel.set('profile', profileModel);
                            eachCb();
                        });
                    }, function (err) {
                        if (err) { 
                            return cb(err)
                        }
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