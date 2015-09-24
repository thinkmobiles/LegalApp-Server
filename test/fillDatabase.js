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

module.exports = function (db, options) {
    var companiesCount = (options && options.counts && options.counts.companies) ? options.counts.companies : 200;
    var documentsCount = (options && options.counts && options.counts.documents) ? options.counts.documents : 1000;
    var employeesCount = (options && options.counts && options.counts.employees) ? options.counts.employees : 2000;
    var templatesCount = (options && options.counts && options.counts.templates) ? options.counts.templates : 200;
    var usersCount = (options && options.counts     && options.counts.users)     ? options.counts.users     : 1000;

    var Models = db.Models;
    var EmployeeModel = Models.Employee;
    var Company = Models.Company;
    var User = Models.User;
    var Profile = Models.Profile;
    var Template = Models.Template;
    var Document = Models.Document;
    var SecretKey = Models.SecretKey;
    var profilesCount = 0;
    var emailCounter = 0;
    var firstNameCounter = 1;
    var lastNameCounter = 1;
    var companyCounter = 1;
    var Links = Models.Links;
    var linkCounter = 0;
    var LinkFields = Models.LinkFields;
    var linkFieldsCounter = 0;
    var templateCount = 0;
    var documentCount = 0;
    var secretKeyCount = 1;
    var employeeCounter = 0;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');

        shaSum.update(pass);

        return shaSum.digest('hex');
    }

    //companies:
    factory.define(TABLES.COMPANIES, Company, {
        name    : function () {
            companyCounter++;
            console.log('insert into companies %s/%s', companyCounter, companiesCount);
            return 'company_' + companyCounter;
        },
        owner_id: function () {
            return companyCounter
        },
        email   : function () {
            return 'company_' + companyCounter + '@company.com'
        },
        country : 'USA',
        city    : 'New York',
        address : function () {
            return companyCounter + ' th Street';
        }
    });

    //profiles:
    factory.define(TABLES.PROFILES, Profile, {
        user_id       : function () {
            profilesCount++;
            console.log('insert into profiles %s/%s', profilesCount, usersCount);
            return (profilesCount+1);
        },
        first_name    : function () {
            firstNameCounter++;
            return 'first_name_' + firstNameCounter;
        },
        last_name     : function () {
            lastNameCounter++;
            return 'last_name_' + lastNameCounter;
        },
        company_id    : function () {
            return Math.round(Math.random() * companiesCount)
        },
        phone         : function () {
            return '101' + Math.round(Math.random() * 9) + '54' + Math.round(Math.random() * 9) + '777' + Math.round(Math.random() * 9)
        },
        permissions   : function () {
            return Math.round(Math.random() * 3)
        },
        sign_authority: function () {
            return Math.round(Math.random()) ? true : false
        }
    });

    //users:
    factory.define(TABLES.USERS, User, {
        password: getEncryptedPass(PASSWORD),
        email   : function () {
            emailCounter++;
            console.log('insert into users - %s/%s', emailCounter, usersCount);
            return 'user_' + emailCounter + '_@test.com';
        }
    });

    factory.define(TABLES.EMPLOYEES, EmployeeModel, {
        email     : function () {
            employeeCounter++;
            console.log('insert into employees %s/%s', employeeCounter, employeesCount);
            return 'employee_' + employeeCounter + '_@test.com';
        },
        first_name: function () {
            return 'employee_first_' + employeeCounter;
        },
        last_name : function () {
            return 'employee_last_' + employeeCounter;
        },
        company_id: function () {
            return Math.round(Math.random() * companiesCount);
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
        name   : function () {
            return 'name_' + linkFieldsCounter;
        },
        code   : function () {
            return '<code_' + linkFieldsCounter + '>';
        },
        type   : function () {
            return Math.round(Math.random()) ? 'FIRST_NAME' : 'LAST_NAME'
        }

    });

    //templates:
    factory.define(TABLES.TEMPLATES, Template, {
        name               : function () {
            templateCount++;
            console.log('insert into templates %s/%s', templateCount, templatesCount);
            return 'template_' + templateCount;
        },
        description        : function () {
            return 'This is the description of Template ' + templateCount;
        },
        html_content       : function () {
            var html = '<div>';

            html += '<h2>Template Name</h2>';
            html += '<p>Hello {first_name} {last_name} </p>';
            html += '</div>';

            return html;
        },
        link_id            : function () {
            return templateCount
        },
        has_linked_template: false
    });

    //documents:
    factory.define(TABLES.DOCUMENTS, Document, {
        name        : function () {
            documentCount++;
            console.log('insert into documents %s/%s', documentCount, documentsCount);
            return 'Document_name_' + documentCount
        },
        html_content: function () {
            var html = '<div>';

            html += '<h2>Template Name</h2>';
            html += '<p>Hello first_name_' + documentCount + ' last_name_' + documentCount + '</p>';
            html += '</div>';

            return html;
        },
        template_id : function () {
            return Math.round(Math.random() * templatesCount)
        },
        //template_id: 1,
        company_id  : function () {
            return Math.round(Math.random() * companiesCount)
        },
        employee_id : function () {
            return Math.round(Math.random() * employeesCount)
        }
    });

    //users_secret_key
    factory.define(TABLES.USERS_SECRET_KEY, SecretKey, {
        user_id   : function () {
            secretKeyCount++;
            return secretKeyCount
        },
        secret_key: function () {
            return tokenGenerator.generate(20);
        }
    });

    return factory;
};
