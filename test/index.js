'use strict';

var TABLES = require('../constants/tables');

var async = require('async');
var schemasModule = require('../migrations/schema');
var schemas;
var server;
var app;
var PostGre;
var knex;

process.env.NODE_ENV = 'test';

server = require('../app.js');
app = server.app;
PostGre = server.PostGre;
knex = server.knex;

schemas = schemasModule(knex);

console.log('>>> initDB ...');

function createTable(tableName, createFieldsFunc) {
    console.log('create table "%s"', tableName);
    
    //knex.schema
    //            .hasTable(tableName)
    //            .then(function (exists) {
    //                console.log('>>> exists', exists);
    //                if (exists) {
    //                    return callback();
    //                }
    //            })
    //            .catch(callback);

    return function (callback) {
        console.log('>>> callback');
        console.log(knex.schema
                .hasTable(tableName));
        

        knex.schema
                .hasTable(tableName)
                .then(function (exists) {
                    console.log('>>> exists', exists);
                    if (exists) {
                        return callback();
                    }
                    knex.schema
                        .createTable(tableName, createFieldsFunc)
                        .then(function (result) {
                            console.log(tableName + ' Table is Created!');
                            callback(null, result);
                        })
                        .catch(callback);
                })
                .catch(callback);
    };
}

function createTables(callback) {
    console.log('>>> try to create tables ...');

    async.series([
        createTable(TABLES.USERS, function (table) {
            table.increments().primary();
            table.string('email').unique();
            table.string('password');
            table.string('confirm_token');
            table.string('forgot_token');
            table.timestamps();
        })
    ], function (err, results) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        console.log('created');
        callback();
    });
}

async.series([
    
    //drop tables:
    function (cb) {
        schemas.drop(function (err) {
            if (err) {
                return cb(err);
            }
            console.log('success');
            cb();
        });
        
    },

    //create tables:
    function (cb) {
        
        cb();
        schemas.create(function (err) {
            if (err) {
                return cb(err);
            }
            console.log('success');
            cb();
        });
        
        //createTables(function (err) {
        //    if (err) {
        //        return cb(err);
        //    }
        //    console.log('success');
        //    cb();
        //});

    },

        ////create default data:
        //function (cb) {
        //    cb(); //TODO: ...
        //}
], function (err, result) {
    if (err) {
        return console.log(err);
    }
    console.log(' ------------------------------- ');
    console.log('>>> run tests: ...');
    console.log(' ------------------------------- ');
    // --------- run tests ------------

    //require('./testHandlers/testSession');

    //require('./testHandlers/users');

    // --------------------------------
});
