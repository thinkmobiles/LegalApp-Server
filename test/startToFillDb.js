var TABLES = require('../constants/tables');

var async = require('async');

module.exports = function (PostGre, done) {
    var factory = require('./fillDatabase')(PostGre);

    async.waterfall([

        //create users:
        function (cb) {
            factory.createMany(TABLES.USERS, {}, 1000, function (err, users) {
                console.log('Users created');
                cb(err, users);
            });
        },

        //create profiles:
        function (userModels, cb) {
            var count = userModels.length;

            factory.createMany(TABLES.PROFILES, {}, count, function (err, profiles) {
                console.log('Profiles created');
                cb(err, count);
            });
        },

        //companies:
        function (count, cb) {
            factory.createMany(TABLES.COMPANIES, {}, 200, function (err, companies) {
                console.log('Companies created');
                cb(err, count);
            });
        },

        //user_companies:
        function (count, cb) {
            factory.createMany(TABLES.USER_COMPANIES, {}, count, function (err, companies) {
                console.log('User_companies created');
                cb(err, count);
            });
        },

        //create templates:
        function (count, cb) {
            factory.createMany(TABLES.TEMPLATES, {}, count, function (err, templateModels) {
                console.log('Templates created');
                cb(err, count);
            });
        },
        function (count, cb) {
            factory.createMany(TABLES.LINKS, {}, count, function (err, links) {
                console.log('Links created');
                cb(err, count);
            });
        },
        function (count, cb) {
            factory.createMany(TABLES.LINKS_FIELDS, {}, count, function (err, linkFields) {
                console.log('Links_Fields created');
                cb(err, count);
            });
        },
        function (count, cb) {
            factory.createMany(TABLES.DOCUMENTS, {}, 2000, function (err, documentModels) {
                console.log('Documents created');
                cb(err, count);
            });
        },
        function (count, cb) {
            factory.createMany(TABLES.USERS_SECRET_KEY, {}, count, function (err, documentModels) {
                console.log('Secret_keys created');
                cb(err, count);
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
