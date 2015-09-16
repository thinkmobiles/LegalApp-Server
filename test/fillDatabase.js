'use strict';

var TABLES = require('../constants/tables');
var PERMISSIONS = require('../constants/permissions');

var factoryGirl = require('factory-girl');
var BookshelfAdapter = require('factory-girl-bookshelf')();
var factory = new factoryGirl.Factory();
var tokenGenerator = require('../helpers/randomPass');

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
    var Document = Models.Document;
    var SecretKey = Models.SecretKey;
    var profilesCount = 1;
    var emailCounter = 1;
    var userCounter = 1;
    var firstNameCounter = 1;
    var lastNameCounter = 1;
    var companyCounter = 1;
    var userCompanyCounter = 1;
    var Links = Models.Links;
    var linkCounter = 0;
    var LinkFields = Models.LinkFields;
    var linkFieldsCounter = 0;
    var templateCount = 0;
    var documentCount = 0;
    var secretKeyCount = 1;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');

        shaSum.update(pass);

        return shaSum.digest('hex');
    }

    //companies:
    factory.define(TABLES.COMPANIES, Company, {
        name: function () {
            companyCounter++;
            return 'company_' + companyCounter;
        },
        owner_id: function () {
            return companyCounter
        },
        email: function () {
            return 'company_' + companyCounter + '@company.com'
        },
        country: 'USA',
        city: 'New York',
        address: function () {
            return companyCounter + ' th Street';
        }
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
        },
        /*company: function () {
            return 'company_' + Math.round(Math.random() * 200)
        },*/
        company_id: function () {
            return Math.round(Math.random() * 200)
        },
        phone: function () {
            return '101' + Math.round(Math.random() * 9) + '54' + Math.round(Math.random() * 9) + '777' + Math.round(Math.random() * 9)
        },
        permissions: function () {
            return Math.round(Math.random() * 3)
        },
        sign_authority: function () {
            return Math.round(Math.random()) ? true : false
        }
    });

    /*//user_companies:
    factory.define(TABLES.USER_COMPANIES, UserCompanies, {
        user_id: function () {
            userCounter++;
            return userCounter
        },
        company_id: function () {
            return Math.round(Math.random() * 200)
        }
    });*/

    //users:
    factory.define(TABLES.USERS, User, {
        password: getEncryptedPass(PASSWORD),
        email: function () {
            emailCounter++;
            return 'user_' + emailCounter + '_@test.com';
        }
    });

    factory.define(TABLES.LINKS, Links, {

        // define attributes using properties and functions:
        name: function () {
            linkCounter++;
            return 'link_' + linkCounter;
        }
    });

    factory.define(TABLES.LINKS_FIELDS, LinkFields, {

        // define attributes using properties and functions:
        link_id: function () {
            linkFieldsCounter++;
            return linkFieldsCounter;
        },
        name: function () {
            return 'name_' + linkFieldsCounter;
        },
        code: function () {
            return '<code_' + linkFieldsCounter + '>';
        },
        type: function () {
            return Math.round(Math.random()) ? 'FIRST_NAME' : 'LAST_NAME'
        }

    });

    //templates:
    factory.define(TABLES.TEMPLATES, Template, {
        name: function () {
            templateCount++;
            return 'template_' + templateCount;
        },
        description: function () {
            return 'This is the description of Template ' + templateCount;
        },
        html_content: function () {
            var html = '<div>';

            html += '<h2>Template Name</h2>';
            html += '<p>Hello {first_name} {last_name} </p>';
            html += '</div>';

            return html;
        },
        link_id: function () {
            return templateCount
        },
        has_linked_template: false
    });

    //documents:
    factory.define(TABLES.DOCUMENTS, Document, {
        name: function () {
            documentCount++;
            return 'Document_name_' + documentCount
        },
        html_content: function () {
            var html = '<div>';

            html += '<h2>Template Name</h2>';
            html += '<p>Hello first_name_' + documentCount + ' last_name_' + documentCount + '</p>';
            html += '</div>';

            return html;
        },
        template_id: function () {
            return Math.round(Math.random() * 1000)
        },
        //template_id: 1,
        company_id: function () {
            return Math.round(Math.random() * 200)
        }
    });

    //users_secret_key
    factory.define(TABLES.USERS_SECRET_KEY, SecretKey, {
        user_id: function () {
            secretKeyCount++;
            return secretKeyCount
        },
        secret_key: function () {
            return tokenGenerator.generate(20);
        }
    });

    return factory;
};
