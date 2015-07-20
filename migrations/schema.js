'use strict';

//var Promise = require('bluebird');
var async = require('async');

module.exports = function (knex) {
    var TABLES = require('../constants/tables');
    //var when = require('when');
    var crypto = require('crypto');
    
    function create(callback) {
        console.log('>>> try to create tables ...');

        //Promise.all([
        //    createTable(TABLES.PROFILES, function (row) {
        //        row.increments().primary();
        //        row.integer('user_id').notNullable().unique();
        //        row.string('first_name');
        //        row.string('last_name');
        //        row.string('company');
        //        row.string('phone');
        //        row.timestamps();
        //    }, function (err) {
        //        console.log('created');
                    
        //    })
        //]);
        async.parallel([
        
            //function (cb) {
            //    createTable(TABLES.PROFILES, function (row) {
            //        row.increments().primary();
            //        row.integer('user_id').notNullable().unique();
            //        row.string('first_name');
            //        row.string('last_name');
            //        row.string('company');
            //        row.string('phone');
            //        row.timestamps();
            //    }, function (err) {
            //        console.log('created');
            //        if (err) { 
            //            return cb(err);
            //        }
            //        cb();
            //    });
            //},

            function (cb) {
                createTable(TABLES.USERS, function (row) {
                    row.increments().primary();
                    row.string('email').unique();
                    row.string('password');
                    row.string('confirm_token');
                    row.string('forgot_token');
                    //row.integer('role').notNullable().default(0); //0 - customer, 1 - superAdmin
                    row.timestamps();
                }, function (err) {
                    if (err) { 
                        return cb(err);
                    }
                    cb();
                });
            }

        ], function (err, results) {
            if (err) {
                if (callback && typeof callback == 'function') {
                    callback(err);
                }
            } else {
                if (callback && typeof callback == 'function') {
                    callback();
                }
            }
        });
    }
    
    function createTable(tableName, crateFieldsFunc, callback) {
        console.log('>>> create table "%s"', tableName);
        //console.log(knex.schema.hasTable(tableName));

        //knex.schema
        //    .hasTable(tableName)
        //    .exec(function (err) {
        //        console.log('>>> exec');
        //        callback();
        //    });

            //.then(function (exists) {
            //    console.log('>>> exists', exists);
            //    callback();
            //}).catch(function (err) {
            //    console.error(err);
            //    callback(err);
            //});
        

        knex.schema.hasTable(tableName)
            .then(function (exists) {
                console.log('>>> exists', exists);
            
                if (!exists) {
                    knex.schema.createTable(tableName, crateFieldsFunc)
                            .then(function () {
                        console.log(tableName + ' Table is Created!');
                        if (callback && typeof callback == 'function') {
                            callback();
                        }
                    })
                            .otherwise(function (err) {
                        console.log(tableName + ' Table Error: ' + err);
                        if (callback && typeof callback == 'function') {
                            callback(err);
                        }
                    })
                } else {
                    if (callback && typeof callback == 'function') {
                        callback();
                    }
                }
            }).catch(function (err) {
                console.error(err);
            });
    }
    
    function createDefaultAdmin() {
        var shaSum = crypto.createHash('sha256');
        shaSum.update('1q2w3e4r'); //default pass
        var encryptedPass = shaSum.digest('hex');
        
        knex('users')
            .insert({
            email: 'admin@admin.com',
            password: encryptedPass,
            role: 1  //'superAdmin'
        })
            .then(function () {
            console.log('superAdmin is Created!');
        })
            .otherwise(function (err) {
            console.log('superAdmin Creation Error: ' + err)
        })
    }
    
    function dropTable(tableName) {
        return function (cb) {
            console.log("DROP TABLE '%s'", tableName);
            knex.schema
                .dropTableIfExists(tableName)
                .then(function (result) {
                    console.log('table "%s" is removed success', tableName);
                    cb(null, result);
                })
                .catch(cb);
        }
    }

    function drop(callback) {
        console.log('>>> try to drop tables ...');

        return async.series([
            //dropTable(TABLES.PROFILES),
            dropTable(TABLES.USERS)
        ], function (err) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback();
                }
            }
        });
    }
    
    return {
        create: create,
        drop: drop
    }
};