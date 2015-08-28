'use strict';

var TABLES = require('../constants/tables');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var SIGN_AUTHORITY = require('../constants/signAuthority');
var CONSTANTS = require('../constants/index');

var crypto = require('crypto');
var async = require('async');
var tokenGenerator = require('../helpers/randomPass');

module.exports = function (knex) {

    function createTables(callback) {

        async.parallel([

            createTable(TABLES.ATTACHMENTS, function (row) {
                row.increments().primary();
                row.integer('attacheable_id').notNullable();
                row.string('attacheable_type');
                row.string('name');
                row.string('key');
                row.timestamps();
            }),

            createTable(TABLES.COMPANIES, function (row) {
                row.increments().primary();
                row.integer('owner_id').index();
                row.string('name');
                row.string('email').unique();
                row.string('country');
                row.string('city');
                row.string('address');
                row.timestamps();
            }),

            createTable(TABLES.DOCUMENTS, function (row) {
                row.increments().primary();
                row.string('name');
                row.text('html_content');
                row.integer('template_id').notNullable().index();
                row.integer('company_id').index();
                row.integer('user_id').index();
                row.integer('assigned_id').index();
                row.integer('status').notNullable().defaultTo(STATUSES.CREATED);
                row.integer('created_by').index();
                row.integer('sent_by').index();
                row.string('access_token');
                row.timestamp('sent_at');
                row.timestamp('signed_at');
                row.json('values');
                row.timestamps();
            }),

            /*createTable(TABLES.FIELDS, function (row) {
                row.increments().primary();
                row.string('name').notNullable();
                row.string('type').notNullable().defaultTo(FIELD_TYPES.STRING);
                row.timestamps();
            }),*/

            createTable(TABLES.IMAGES, function (row) {
                row.increments().primary();
                row.integer('imageable_id').notNullable();
                row.string('imageable_type');
                row.string('name');
                row.string('key');
                row.timestamps();
            }),

            createTable(TABLES.INVITES, function (row) {
                row.increments().primary();
                row.integer('inivtee_id').notNullable().index();
                row.string('invited_id').notNullable().index();
                row.timestamps();
            }),

            createTable(TABLES.MESSAGES, function (row) {
                row.increments().primary();
                row.integer('owner_id').notNullable().index();
                row.string('email');
                row.string('subject');
                row.text('body');
                row.string('type');
                row.timestamps();
            }),

            createTable(TABLES.PROFILES, function (row) {
                row.increments().primary();
                row.integer('user_id').notNullable().unique();
                row.string('first_name');
                row.string('last_name');
                row.string('company');
                row.string('phone');
                row.integer('permissions').notNullable().defaultTo(PERMISSIONS.USER);
                row.boolean('sign_authority').notNullable().defaultTo(SIGN_AUTHORITY.DISABLED);
                row.timestamps();
            }), 

            createTable(TABLES.USER_COMPANIES, function (row) {
                row.increments().primary();
                row.integer('user_id').notNullable().index();
                row.integer('company_id').notNullable().index();
                row.timestamps();
            }), 
                
            createTable(TABLES.USERS, function (row) {
                row.increments().primary();
                row.string('email').unique();
                row.string('password');
                row.string('confirm_token');
                row.string('forgot_token');
                row.integer('status').notNullable().defaultTo(STATUSES.CREATED);
                row.timestamps();
            }),

            createTable(TABLES.LINKS, function (row) {
                row.increments().primary();
                row.string('name');
                row.integer('company_id').index();
                row.timestamps();
            }),

            createTable(TABLES.LINKS_FIELDS, function (row) {
                row.increments().primary();
                row.integer('link_id').notNullable().index();
                row.string('name');
                row.string('code');
                row.string('type').notNullable().defaultTo(FIELD_TYPES.STRING);
                row.timestamps();
            }),

            createTable(TABLES.LINKED_TEMPLATES, function (row) {
                row.increments().primary();
                row.integer('template_id').notNullable().index();
                row.integer('linked_id').notNullable().index();
                row.timestamps();
            }),

            createTable(TABLES.TEMPLATES, function (row) {
                row.increments().primary();
                row.integer('company_id').index();
                row.integer('link_id').index();
                row.string('name');
                row.text('description');
                row.text('html_content');
                row.boolean('has_linked_template').notNullable().defaultTo(false);
                row.timestamps();
            }),

            createTable(TABLES.USERS_SECRET_KEY, function (row) {
                row.increments().primary();
                row.integer('user_id').notNullable().unique();
                row.string('secret_key').notNullable().unique();
                row.text('sign_image');
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

    function createDefaults(callback) {
        async.waterfall([

            //create default super admin:
            function (cb) {
                var encryptedPass;
                var data;
                var shaSum = crypto.createHash('sha256');

                shaSum.update(CONSTANTS.DEFAULT_SUPERADMIN_PASSWORD); //default pass
                encryptedPass = shaSum.digest('hex');
                data = {
                    //id: CONSTANTS.DEFAULT_SUPERADMIN_ID,
                    email: CONSTANTS.DEFAULT_SUPERADMIN_EMAIL,
                    password: encryptedPass
                };

                insertData(TABLES.USERS, data, cb);
            },

            //create super admin\s profile:
            function (cb) {
                var data = {
                    user_id: CONSTANTS.DEFAULT_SUPERADMIN_ID,
                    first_name: CONSTANTS.DEFAULT_SUPERADMIN_FIRST_NAME,
                    last_name: CONSTANTS.DEFAULT_SUPERADMIN_LAST_NAME,
                    permissions: PERMISSIONS.SUPER_ADMIN
                };

                insertData(TABLES.PROFILES, data, cb);
            },

            //create McInnesCooper's company:
            function(cb) {
                var data = {
                    //id: CONSTANTS.DEFAULT_COMPANY_ID,
                    name: CONSTANTS.DEFAUlT_COMPANY_NAME,
                    owner_id: CONSTANTS.DEFAULT_SUPERADMIN_ID,
                    email: CONSTANTS.DEFAULT_COMPANY_EMAIL,
                    country: CONSTANTS.DEFAULT_COMPANY_COUNTRY,
                    city: CONSTANTS.DEFAULT_COMPANY_CITY,
                    address: CONSTANTS.DEFAULT_COMPANY_ADDRESS
                };

                insertData(TABLES.COMPANIES, data, cb);
            },

            //create default user_companies:
            function (cb) {
                var data = {
                    user_id: CONSTANTS.DEFAULT_SUPERADMIN_ID,
                    company_id: CONSTANTS.DEFAULT_COMPANY_ID
                };

                insertData(TABLES.USER_COMPANIES, data, cb);
            },

            function (cb) {
                var data = {
                    user_id: CONSTANTS.DEFAULT_SUPERADMIN_ID,
                    secret_key: tokenGenerator.generate(20)
                };

                insertData(TABLES.USERS_SECRET_KEY, data, cb);
            }

        ], function (err, result) {
            if (callback && (typeof callback === 'function')) {
                callback(err, result);
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

    function insertData(tableName, data, callback) {
        console.log('>>> insertData()');
        console.log('>>> tableName:', tableName);
        console.log('>>> data:', data);

        knex(tableName)
            .where(data)
            .then(function (rows) {
                if (rows && rows.length) { //the data is already exists:
                    if (callback && (typeof callback === 'function')) {
                        callback();
                    }
                    return;
                }

                knex(tableName)
                    .insert(data)
                    .then(function (){
                        if (callback && (typeof callback === 'function')) {
                            callback();
                        }
                    })
                    .catch(function (err) {
                        if (callback && (typeof callback === 'function')) {
                            callback(err);
                        }
                    })

            })
            .catch(function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
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

    function create(callback) {

        async.waterfall([
            createTables,
            createDefaults
        ], function (err) {
            if(err) {
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
            dropTable(TABLES.ATTACHMENTS),
            dropTable(TABLES.COMPANIES),
            dropTable(TABLES.DOCUMENTS),
            //dropTable(TABLES.FIELDS),
            dropTable(TABLES.IMAGES),
            dropTable(TABLES.INVITES),
            dropTable(TABLES.MESSAGES),
            dropTable(TABLES.LINKED_TEMPLATES),
            dropTable(TABLES.LINKS_FIELDS),
            dropTable(TABLES.LINKS),
            dropTable(TABLES.PROFILES),
            dropTable(TABLES.USER_COMPANIES),
            dropTable(TABLES.USERS),
            dropTable(TABLES.TEMPLATES),
            dropTable(TABLES.USERS_SECRET_KEY)
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