'use strict';

var TABLES = require('../constants/tables');

var path = require('path');
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

console.log('__dirname');
console.log(__dirname);
console.log(process.env.AMAZON_S3_BUCKET);
console.log(process.env.NODE_ENV);
var fsUploadDir = path.join(__dirname, '..', process.env.AMAZON_S3_BUCKET);
console.log(fsUploadDir);

var templateFilesDir = path.join(__dirname, '..', 'migrations', 'files');
console.log(templateFilesDir);

var defaultTemplatesHandler;
var defaultTemplatesHandlerOptions = {
    fsUploadDir: fsUploadDir, //process.env.AMAZON_S3_BUCKET
    templateFilesDir: templateFilesDir
};
defaultTemplatesHandler = require('../migrations/defaultTemplates')(knex, defaultTemplatesHandlerOptions);

describe('Database initialization', function () {
    this.timeout(500000);

    it('Drop the tables', function (done) {
        schemas.drop(done);
    });

    it('Create tables', function (done) {
        schemas.create(done);
    });

   /* it('Create Default Templates', function (done) {
        defaultTemplatesHandler.createDefaultTemplates(done);
    });*/

    it('Fill Database with big data', function(done){
        var startToFillDb = require('./startToFillDb');
        startToFillDb(PostGre, done);
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
