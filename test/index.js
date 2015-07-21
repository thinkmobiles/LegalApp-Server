'use strict';

var TABLES = require('../constants/tables');

var async = require('async');
var schemasModule = require('../migrations/schema');
var schemas;
var server;
var app;
var PostGre;
var knex;
var defaults;

process.env.NODE_ENV = 'test';

server = require('../app.js');
app = server.app;
PostGre = server.PostGre;
knex = PostGre.knex;
schemas = schemasModule(knex);
defaults = require('./defaults')(PostGre);

describe('Database initialization', function () {
    
    console.log('>>> initDB ...');

    it('Drop the tables', function (done) {
        schemas.drop(function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });

    it('Create tables', function (done) {
        schemas.create(function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });

    it('Create default data', function (done) {
        defaults.create(done);
        //done(); //TODO: ...
    });


});

describe('Include test handlers', function () {

    //require();

});
