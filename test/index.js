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
    this.timeout(500000);

    it('Drop the tables', function (done) {
        schemas.drop(done);
    });

    it('Create tables', function (done) {
        schemas.create(done);
    });

    it('Fill Database with big data', function(done){
        var start = require('./startToFillDb');
        start(PostGre, done);
    });

    /*it('Create default data', function (done) {
        defaults.create(done);
    });*/

    it('Test handlers', function () {
        //require('./testHandlers/testUsers')(PostGre, defaults);
        //require('./testHandlers/testLinks')(PostGre, defaults);
        //require('./testHandlers/testTemplates')(PostGre, defaults);
        //require('./testHandlers/testCompanies')(PostGre, defaults);
        //require('./testHandlers/testDocuments')(PostGre, defaults);
    });
});
