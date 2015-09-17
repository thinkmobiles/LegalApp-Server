'use strict';

var TABLES = require('../constants/tables');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var CONSTANTS = require('../constants/index');

var async = require('async');

module.exports = function (knex) {
    var FIELDS = [
        {
            name: 'Date of document',
            type: FIELD_TYPES.DATE
        },
        {
            name: 'Company name',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Company address',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Employee name',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Employee address',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Employee title',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Date employment starts',
            type: FIELD_TYPES.DATE
        },
        {
            name: 'Reports to',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Description of position/duties',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Employee compensation (yearly)',
            type: FIELD_TYPES.CURRENCY
        },
        {
            name: 'Title of Company signatory',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Description of prior inventions',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Contractor name (company)',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Contractor name (principal)',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Contractor address',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Contractor principal address',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Description of services',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Term of services (years)',
            type: FIELD_TYPES.NUMBER
        },
        {
            name: 'Governing law',
            type: FIELD_TYPES.PROVINCE
        },
        {
            name: 'Title of Contractor signatory',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Company email',
            type: FIELD_TYPES.EMAIL
        },
        {
            name: 'Contractor email',
            type: FIELD_TYPES.EMAIL
        },
        {
            name: 'Company fax',
            type: FIELD_TYPES.PHONE
        },
        {
            name: 'Contractor fax',
            type: FIELD_TYPES.PHONE
        },
        {
            name: 'Company contact for notices',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Maximum ESOP shares reserved',
            type: FIELD_TYPES.NUMBER
        },
        {
            name: 'Name of optionee',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Date of grant',
            type: FIELD_TYPES.DATE
        },
        {
            name: 'Number of shares subject to option',
            type: FIELD_TYPES.NUMBER
        },
        {
            name: 'Vesting period',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Exercise price',
            type: FIELD_TYPES.CURRENCY
        },
        {
            name: 'Option expiry date',
            type: FIELD_TYPES.DATE
        },
        {
            name: 'Name of director(s)',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Date ESOP was adopted',
            type: FIELD_TYPES.DATE
        },
        {
            name: 'Name of company entering into NDA',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Address of company entering into NDA',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Description of potential business relationship re NDA',
            type: FIELD_TYPES.STRING
        },
        {
            name: 'Name of Company signatory',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Name of signatory for other party to NDA',
            type: FIELD_TYPES.NAME
        },
        {
            name: 'Title of signatory for other party to NDA',
            type: FIELD_TYPES.NAME
        }

    ];

    var TEMPLATES = [
        {
            templateName: 'Employment k',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2],
                FIELDS[3],
                FIELDS[4],
                FIELDS[5],
                FIELDS[6],
                FIELDS[7],
                FIELDS[8],
                FIELDS[9],
                FIELDS[10],
                FIELDS[11],
                FIELDS[18]
            ] //13
        },
        {
            templateName: 'Contractor k',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2],
                FIELDS[10],
                FIELDS[12],
                FIELDS[13],
                FIELDS[14],
                FIELDS[15],
                FIELDS[16],
                FIELDS[17],
                FIELDS[18],
                FIELDS[19],
                FIELDS[20],
                FIELDS[21],
                FIELDS[22],
                FIELDS[23],
                FIELDS[24]
            ] //17
        },
        {
            templateName: 'PIIA',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[3],
                FIELDS[10],
                FIELDS[11],
                FIELDS[18]
            ] //6
        },
        {
            templateName: 'ESOP',
            fields: [
                FIELDS[1],
                FIELDS[18],
                FIELDS[25]
            ] //3
        },
        {
            templateName: 'Option Agreement',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[18],
                FIELDS[26],
                FIELDS[27],
                FIELDS[28],
                FIELDS[29],
                FIELDS[30],
                FIELDS[31]
            ] //9
        },
        {
            templateName: 'Director(s) Resolution re ESOP',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[25],
                FIELDS[32]
            ] //4
        },
        {
            templateName: 'Director(s) Resolution re Options',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[26],
                FIELDS[27],
                FIELDS[28],
                FIELDS[29],
                FIELDS[30],
                FIELDS[31],
                FIELDS[32],
                FIELDS[33]
            ] //10
        },
        {
            templateName: 'One-way NDA',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2],
                FIELDS[10],
                FIELDS[18],
                FIELDS[34],
                FIELDS[35],
                FIELDS[36],
                FIELDS[37],
                FIELDS[38],
                FIELDS[39]
            ] //11
        },
        {
            templateName: 'Privacy Policy',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2]
            ] //3
        },
        {
            templateName: 'Terms of Service',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2]
            ] //3
        }
    ];



    function CreateDefaultTemplates(callback) {
        var linkId;
        var templName;
        var curDate = new Date();

        async.eachSeries(TEMPLATES, function (templ, cb) {
            templName = templ.templateName;

            async.series([

                function (cB) {

                    knex(TABLES.LINKS)
                        .insert({
                            name: templName,
                            updated_at: curDate,
                            created_at: curDate
                        }, 'id')
                        .then(function (queryResult) {
                            linkId = queryResult[0];
                            cB();
                        })
                        .catch(cB)
                },

                function (cB) {

                    for (var i = templ.fields.length; i--;) {
                        templ.fields[i].link_id = linkId;
                        templ.fields[i].code = 'Some code';
                        templ.fields[i].updated_at = curDate;
                        templ.fields[i].created_at = curDate;
                    }
                    cB();
                },

                function (cB) {

                    knex(TABLES.TEMPLATES)
                        .insert({
                            link_id: linkId,
                            name: templName,
                            description: 'Some description',
                            html_content: 'Some html_content',
                            marketing_content: 'Some marketing_content',
                            updated_at: curDate,
                            created_at: curDate
                        })
                        .then(function () {
                            cB()
                        })
                        .catch(cB)
                },

                function (cB) {

                    knex(TABLES.LINKS_FIELDS)
                        .insert(templ.fields)
                        .then(function () {
                            cB()
                        })
                        .catch(cB)
                }

            ], function (err) {

                if (err) {
                    return cb(err)
                }

                cb()
            });

        }, function (err) {
            if (err) {
                return callback(err)
            }
            callback()
        })

    }

    return {
        CreateDefaultTemplates: CreateDefaultTemplates
    }
};