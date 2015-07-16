module.exports = function (knex, Promise) {

    var when = require('when');
    var crypto = require('crypto');

    function create() {
        Promise.all([

            createTable('users',
                function (row) {
                    row.increments().primary();
                    row.string('email').unique();
                    row.string('password');
                    row.string('first_name');
                    row.string('last_name');
                    row.string('confirm_token');
                    row.integer('role').notNullable().default(0); //0 - customer, 1 - superAdmin
                    row.timestamps();
                },
                function (err) {
                    if (!err) {
                        createDefaultAdmin();
                    }
                }
            )
        ]);
    }

    function createTable(tableName, crateFieldsFunc, callback) {
        knex.schema.hasTable(tableName).then(function (exists) {
            if (!exists) {
                return knex.schema.createTable(tableName, crateFieldsFunc)
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

    function drop() {
        return when.all([
            knex.schema.dropTableIfExists('users')
        ]);
    }

    return {
        create: create,
        drop: drop
    }
};