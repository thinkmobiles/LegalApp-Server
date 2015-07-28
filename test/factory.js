'use strict';

var TABLES = require('../constants/tables');
var PERMISSIONS = require('../constants/permissions');

var factoryGirl = require('factory-girl');
var BookshelfAdapter = require('factory-girl-bookshelf')();
var factory = new factoryGirl.Factory();

factory.setAdapter(BookshelfAdapter); // use the Bookshelf adapter

var crypto = require('crypto');
var PASSWORD = '123456';

module.exports = function (db) {
    var Models = db.Models;
    var Collections = db.Collections;
    var Company = Models.Company;
    var UserCompanies = Models.UserCompanies;
    var User = Models.User;
    var Profile = Models.Profile;
    var Template = Models.Template;
    var profilesCount = 0;
    var emailCounter = 0;
    var firstNameCounter = 0;
    var lastNameCounter = 0;
    var companyCounter = 0;
    var userCompanyCounter = 0;
    var Links = Models.Links;
    var linkcounter = 0;
    var templateCount = 0;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };
    
    //companies:
    factory.define(TABLES.COMPANIES, Company, {
        name: function () {
            companyCounter++;
            return 'company_' + companyCounter;
        }, 
        owner_id: companyCounter
    });

    //profiles:
    factory.define(TABLES.PROFILES, Profile, {
        //permissions: PERMISSIONS.OWNER,
        user_id: function () {
            profilesCount++;
            return profilesCount;
        },
        first_name: function () {
            firstNameCounter++;
            return 'first_name_' + firstNameCounter;
        },
        last_name: function () {
            lastNameCounter++;
            return 'last_name_' + lastNameCounter;
        }
    });
    
    //user_companies:
    factory.define(TABLES.USER_COMPANIES, UserCompanies, {
        
    });

    //users:
    factory.define(TABLES.USERS, User, {

        // define attributes using properties and functions:
        password: getEncryptedPass(PASSWORD),
        email: function () {
            emailCounter++;
            return 'user_' + emailCounter + '_@test.com';
        }
    });

    factory.define(TABLES.LINKS, Links, {

        // define attributes using properties and functions:
        name: function () {
            linkcounter++;
            return 'link_' + linkcounter;
        },
        company_id: function () {
            companyCounter++;
            return companyCounter;
        }
    });

    //templates:
    factory.define(TABLES.TEMPLATES, Template, {
        name: function () {
            templateCount++;
            return 'template_' + templateCount;
        },
        company_id: 1,
        link_id: 1
    });

    return factory;
};