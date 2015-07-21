'use strict';

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
    
    defaultData.users = [
        {
            confirm_token: '123'
        }
    ];
 
    function create(callback) {
        
        async.waterfall([
            
            //create users:
            function (cb) {
                factory.buildMany('users', defaultData.users, function (err, users) {
                    cb(err, users);
                    console.log(user);
                });
            }

        ], function (err) {
            if (err) { 
                return callback(err);
            }
            callback();
        });
    };

    return {
        create: create,
        data: defaultData
    }
};