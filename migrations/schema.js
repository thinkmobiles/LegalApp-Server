'use strict';

var async = require('async');

module.exports = function (knex) {
    var TABLES = require('../constants/tables');
    var crypto = require('crypto');
    
    function create(callback) {

        async.parallel([
        
                createTable(TABLES.PROFILES, function (row) {
                    row.increments().primary();
                    row.integer('user_id').notNullable().unique();
                    row.string('first_name');
                    row.string('last_name');
                    row.string('company');
                    row.string('phone');
                    row.timestamps();
                }), 
                
                createTable(TABLES.USERS, function (row) {
                    row.increments().primary();
                    row.string('email').unique();
                    row.string('password');
                    row.string('confirm_token');
                    row.string('forgot_token');
                    //row.integer('role').notNullable().default(0); //0 - customer, 1 - superAdmin
                    row.timestamps();
                })


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
    
    function createTable(tableName, crateFieldsFunc) {
        console.log('CREATE TABLE "%s"', tableName);
        
        return function (cb) {
            knex.schema.hasTable(tableName)
                .then(function (exists) {
                    if (exists) {
                        //console.log('  >>> exists', exists);
                        return cb();
                    }
                     
                    knex.schema.createTable(tableName, crateFieldsFunc)
                        .then(function () {
                            //console.log('  >>> "%s" table is created', tableName);
                            cb();
                        })
                        .catch(function (err) {
                            console.error(tableName + ' Table Error: ' + err);
                            cb(err);
                        });
                    
                }).catch(function (err) {
                    cb(err);
                });
        }
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
            //console.log('DROP TABLE IF EXISTS "%s"', tableName);
            knex.schema
                .dropTableIfExists(tableName)
                .then(function (result) {
                    //console.log('  >>> table "%s" is removed', tableName);
                    cb(null, result);
                })
                .catch(function (err) {
                    cb(err);
                });
        }
    }

    function drop(callback) {

        return async.series([
            dropTable(TABLES.PROFILES),
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