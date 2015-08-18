'use strict';

var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
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
    var userCounter = 1;

    var defaultData = {};

    var users = [{
        email: 'user1@mail.com'
    }, {
        email: 'user2@mail.com'
    }, {
        email: 'unconfirmed@mail.com',
        confirm_token: 'unconfirmed_user'
    }, {
        email: 'editor@mail.com'
    }, {
        email: 'base.user@mail.com'
    }, {
        email: 'admin.user@company1.com'
    }, {
        email: 'deleted.user@mail.com',
        status: STATUSES.DELETED
    }];

    var profiles = [{
        first_name: 'user',
        last_name: '1',
        permissions: PERMISSIONS.OWNER
    }, {
        first_name: 'user',
        last_name: '2',
        permissions: PERMISSIONS.OWNER
    }, {
        first_name: 'unconfirmed',
        last_name: 'user'
    }, {
        first_name: 'editor',
        last_name: 'user',
        permissions: PERMISSIONS.EDITOR
    }, {
        first_name: 'base',
        last_name: 'user',
        permissions: PERMISSIONS.USER
    }, {
        first_name: 'admin',
        last_name: 'user',
        permissions: PERMISSIONS.ADMIN
    }, {
        first_name: 'deleted',
        last_name: 'user',
        permissions: PERMISSIONS.EDITOR
    }];

/*    var userCompanies = [{
        user_id: 1,
        company_id: 1
    }, {
        user_id: 2,
        company_id: 2
    }, {
        user_id: 3,
        company_id: 1
    }, {
        user_id: 4,
        company_id: 1
    }, {
        user_id: 5,
        company_id: 1
    }, {
        user_id: 6,
        company_id: 1
    }];*/

    var userCompanies = [{
        user_id: 2,
        company_id: 2
    }, {
        user_id: 3,
        company_id: 3
    }, {
        user_id: 4,
        company_id: 2
    }, {
        user_id: 5,
        company_id: 2
    }, {
        user_id: 6,
        company_id: 2
    }, {
        user_id: 7,
        company_id: 2
    }, {
        user_id: 8,
        company_id: 2
    }];

    var companies = [{
        name: 'company 1',
        owner_id: 2
    }, {
        name: 'company 2',
        owner_id: 3
    }];
    var links = [{
        name: 'link 1',
        company_id: 2
    }, {
        name: 'link 2',
        company_id: 2

    }, {
        name: 'link 3',
        company_id: 3
    }, {
        name: 'link 4',
        company_id: 4
    }];
    var links_fields = [
        {
            link_id: 1,
            name: 'first_name',
            code: '{first_name}',
            type: FIELD_TYPES.FIRST_NAME
        },
        {
            link_id: 1,
            name: 'last_name',
            code: '{last_name}',
            type: FIELD_TYPES.LAST_NAME
        },
        {
            name: 'First test name',
            code: 'ftname',
            type: FIELD_TYPES.FIRST_NAME
        }, {
            name: 'Last test name',
            code: 'ltname',
            type: FIELD_TYPES.LAST_NAME
        }, {
            name: '5500 грн.',
            code: 'tsalary',
            type: FIELD_TYPES.NUMBER
        }
    ];

    var templates = [
        {
            name: 'Employee',
            link_id: 1,
            company_id: 1
        },
        {
            name: 'Employee',
            link_id: 2,
            company_id: 2
        },
        {
            name: 'License',
            link_id: 3,
            company_id: 1
        }
    ];
    var documents = [
        {
            template_id: 1
        },
        {
            template_id: 2,
            company_id: 2
        },
        {
            template_id: 2,
            company_id: 2
        },
        {
            template_id: 2,
            company_id: 2
        }
    ];
    function create(callback) {
        async.waterfall([

            //create users:
            function (cb) {
                factory.createMany(TABLES.USERS, users, 7, function (err, users) {
                    defaultData.users = users;
                    cb(err, users);
                });
            },

            //create profiles:
            function (userModels, cb) {
                var count = userModels.length;

                factory.createMany(TABLES.PROFILES, profiles, count, function (err, profiles) {
                    if (err) {
                        return cb(err);
                    }

                    userModels.map(function (userModel, index) {
                        var profileModel = profiles[index];
                        userModel.set('profile', profileModel);
                    });

                    cb();
                });
            },

            //companies:
            function (cb) {
                factory.createMany(TABLES.COMPANIES, companies, 2, function (err, companies) {
                    if (err) return cb(err);
                    defaultData.companies = companies;
                    cb();
                });
            },

            //user_companies:
            function (cb) {
                factory.createMany(TABLES.USER_COMPANIES, userCompanies, function (err, companies) {
                    if (err) return cb(err);
                    defaultData.userCompanies = userCompanies;
                    cb();
                });
            },

            //create templates:
            function (cb) {
                factory.createMany(TABLES.TEMPLATES, templates, function (err, templateModels) {
                    if (err) return cb(err);
                    defaultData.templates = templateModels;
                    cb();
                });
            },
            function (cb) {
                factory.createMany(TABLES.LINKS, links, 3, function (err, links) {
                    defaultData.links = links;
                    cb();
                });
            },
            function (cb) {
                factory.createMany(TABLES.LINKS_FIELDS, links_fields, 5, function (err, linkFields) {
                    defaultData.links_fields = linkFields;
                    cb();
                });
            },
            function (cb) {
                factory.createMany(TABLES.DOCUMENTS, documents, function (err, documentModels) {
                    defaultData.documents = documentModels;
                    cb();
                });
            }

        ], function (err, result) {
            if (err) {
                return callback(err);
            }
            callback(err, result);
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