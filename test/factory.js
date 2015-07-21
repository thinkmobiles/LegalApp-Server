'use strict';

var TABLES = require('../constants/tables');

var factoryGirl = require('factory-girl');
var BookshelfAdapter = require('factory-girl-bookshelf')();
var factory = new factoryGirl.Factory();

factory.setAdapter(BookshelfAdapter); // use the Bookshelf adapter

var crypto = require('crypto');
var PASSWORD = '123456';

module.exports = function (db) {
    var Models = db.Models;
    var Collections = db.Collections;
    var User = Models.User;
    var Profile = Models.Profile;
    var emailCounter = 1;
    
    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };
    
    factory.define(TABLES.USERS, User, {
        
        // define attributes using properties and functions:
        password: getEncryptedPass(PASSWORD),
        email: function () {
            emailCounter++;
            return 'user_' + emailCounter + '_@test.com';
        }
    });
    
    return factory;
};