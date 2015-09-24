var TABLES = require('../constants/tables');

var async = require('async');
var counts = {
    users    : 1000,
    employees: 2000,
    companies: 200,
    templates: 200,
    links    : 200,
    documents: 2000
};

module.exports = function (PostGre, done) {
    var factory = require('./fillDatabase')(PostGre, {counts: counts});

    async.waterfall([

        //create users:
        function (cb) {
            factory.createMany(TABLES.USERS, {}, counts.users, function (err, users) {
                if (err){
                    return cb(err);
                }
                console.log('Users created');
                cb();
            });
        },

        //create profiles:
        function (cb) {
            factory.createMany(TABLES.PROFILES, {}, counts.users, function (err, profiles) {
                if (err){
                    return cb(err);
                }
                console.log('Profiles created');
                cb();
            });
        },

        //companies:
        function (cb) {
            factory.createMany(TABLES.COMPANIES, {}, counts.companies, function (err, companies) {
                if (err){
                    return cb(err);
                }
                console.log('Companies created');
                cb();
            });
        },

        //create employees:
        function (cb) {
            factory.createMany(TABLES.EMPLOYEES, {}, counts.employees, function (err, employees) {
                if (err){
                    return cb(err);
                }
                console.log('Employees created');
                cb();
            });
        },

        //create templates:
        function (cb) {
            factory.createMany(TABLES.TEMPLATES, {}, counts.templates, function (err, templateModels) {
                if (err){
                    return cb(err);
                }
                console.log('Templates created');
                cb();
            });
        },
        function (cb) {
            factory.createMany(TABLES.LINKS, {}, counts.links, function (err, links) {
                if (err){
                    return cb(err);
                }
                console.log('Links created');
                cb();
            });
        },
        function (cb) {
            factory.createMany(TABLES.LINKS_FIELDS, {}, counts.links, function (err, linkFields) {
                if (err){
                    return cb(err);
                }
                console.log('LinkFields created');
                cb();
            });
        },
        function (cb) {
            factory.createMany(TABLES.DOCUMENTS, {}, counts.documents, function (err, documentModels) {
                if (err){
                    return cb(err);
                }
                console.log('Documents created');
                cb();
            });
        },
        function (cb) {
            factory.createMany(TABLES.USERS_SECRET_KEY, {}, counts.users, function (err, documentModels) {
                if (err){
                    return cb(err);
                }
                console.log('SecreKeys created');
                cb();
            });
        }

    ], function (err, result) {
        if (err) {
            return console.log(err);
        }
        console.log('======All tables successfully created============');
        done();
    });

};
