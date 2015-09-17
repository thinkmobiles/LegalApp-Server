'use strict';

var TABLES = require('../constants/tables');
var FIELD_TYPES = require('../constants/fieldTypes');
var PERMISSIONS = require('../constants/permissions');
var CONSTANTS = require('../constants/index');
var BUCKETS = require('../constants/buckets');
var fs = require('fs');

var async = require('async');
var MammothHandler = require('../handlers/mammoth');
var uploaderConfig;
var amazonS3conf;

if (process.env.UPLOADER_TYPE === 'AmazonS3') {
    amazonS3conf = require('../config/aws');
    uploaderConfig = {
        type: process.env.UPLOADER_TYPE,
        awsConfig: amazonS3conf
    };
} else {
    uploaderConfig = {
        type: process.env.UPLOADER_TYPE,
        directory: '../public/uploads/' + process.env.NODE_ENV.toLowerCase()
    };
}

var uploader = require('../helpers/imageUploader/imageUploader')(uploaderConfig);

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
            attachment: 'Template Example1.docx',
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
            attachment: 'Template Example2.docx',
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
            attachment: 'Template Example3.docx',
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
            attachment: 'Template Example4.docx',
            fields: [
                FIELDS[1],
                FIELDS[18],
                FIELDS[25]
            ] //3
        },
        {
            templateName: 'Option Agreement',
            attachment: 'Template Example5.docx',
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
            attachment: 'Template Example6.docx',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[25],
                FIELDS[32]
            ] //4
        },
        {
            templateName: 'Director(s) Resolution re Options',
            attachment: 'Template Example7.docx',
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
            attachment: 'Template Example8.docx',
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
            attachment: 'Template Example9.docx',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2]
            ] //3
        },
        {
            templateName: 'Terms of Service',
            attachment: 'Template Example10.docx',
            fields: [
                FIELDS[0],
                FIELDS[1],
                FIELDS[2]
            ] //3
        }
    ];
    var mammothHandler = new MammothHandler();

    function random(number) {
        return Math.floor((Math.random() * number));
    };

    function computeFileName(name, key) {
        return key + '_' + name;
    }

    function computeKey(name) {
        var ticks_ = new Date().valueOf();
        var key;

        if (name) {
            key = ticks_ + '_' + random(1000) + '_' + name;
        } else {
            key = ticks_ + '_' + random(1000);
        }

        return key;
    };

    function createDefaultTemplates(callback) {
        var bucket = BUCKETS.TEMPLATE_FILES;
        var path = './files';
        var curDate = new Date();
        var converterParams;
        var originalFilename;
        var uploadOptions;
        var templName;
        var linkId;
        var fileName;
        var key;

        async.eachSeries(TEMPLATES, function (templ, cb) {
            templName = templ.templateName;
            originalFilename = templ.attachment;
            converterParams = {
                path: path + '/' + originalFilename
            };

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

                    async.waterfall([

                        function(Cb) {
                            fs.readFile(converterParams.path, function (err, data) {
                                if (err) {
                                    return Cb(err);
                                }
                                Cb(null, data);
                            });
                        },

                        function (buffer, Cb) {
                            bucket = BUCKETS.TEMPLATE_FILES;
                            key = computeKey();
                            fileName = computeFileName(originalFilename, key);
                            uploadOptions = {
                                folderName: bucket,
                                fileName: fileName,
                                originalFileName: originalFilename,
                                buffer: buffer
                            };

                            if (process.env.NODE_ENV !== 'production') {
                                console.log('--- Upload file ----------------');
                                console.log(uploadOptions);
                                console.log('--------------------------------');
                            }

                            //uploader.uploadFile(bucket, fileName, buffer, function (err, fileName) {
                            uploader.uploadFile(uploadOptions, function (err) {
                                if (err) {
                                    return Cb(err);
                                }

                                Cb();
                            });
                        },

                        function(Cb) {
                            mammothHandler.docx2html(converterParams, function (htmlContent) {

                                if (!htmlContent) {
                                    return cB(new Error('Miss html'))
                                }
                                Cb(null, htmlContent)
                            })
                        },

                        function(htmlContent, Cb) {
                            knex(TABLES.TEMPLATES)
                                .insert({
                                    link_id: linkId,
                                    name: templName,
                                    description: 'Some description',
                                    html_content: htmlContent,
                                    marketing_content: 'Some marketing_content',
                                    updated_at: curDate,
                                    created_at: curDate
                                }, 'id')
                                .then(function (queryResult) {
                                    Cb(null, queryResult[0])
                                })
                                .catch(Cb)
                        },

                        function (attachId, Cb) {

                            knex(TABLES.ATTACHMENTS)
                                .insert({
                                    attacheable_id: attachId,
                                    attacheable_type: 'template',
                                    name: originalFilename,
                                    key: key,
                                    updated_at: curDate,
                                    created_at: curDate
                                })
                                .then(function () {
                                    Cb()
                                })
                                .catch(Cb)
                        }

                    ], function (err) {

                        if (err) {
                            return cB(err)
                        }

                        cB()
                    })

                   /* mammothHandler.docx2html(converterParams, function (htmlContent) {

                        if (!htmlContent) {
                            return cB(new Error('Miss html'))
                        }

                        async.waterfall([

                            //get file from request:
                            function (cb) {

                                fs.readFile(converterParams.path, function (err, data) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    cb(null, data);
                                });
                            },

                            //save file to storage:
                            function (buffer, cb) {
                                bucket = BUCKETS.TEMPLATE_FILES;
                                key = computeKey();
                                fileName = computeFileName(originalFilename, key);
                                uploadOptions = {
                                    folderName: bucket,
                                    fileName: fileName,
                                    originalFileName: originalFilename,
                                    buffer: buffer
                                };

                                if (process.env.NODE_ENV !== 'production') {
                                    console.log('--- Upload file ----------------');
                                    console.log(uploadOptions);
                                    console.log('--------------------------------');
                                }

                                //uploader.uploadFile(bucket, fileName, buffer, function (err, fileName) {
                                uploader.uploadFile(uploadOptions, function (err) {
                                    if (err) {
                                        return cb(err);
                                    }

                                    cb();
                                });
                            }

                        ], function (err) {

                            if (err) {
                                if (callback && (typeof callback === 'function')) {
                                    callback(err);
                                }
                            }

                            knex(TABLES.TEMPLATES)
                                .insert({
                                    link_id: linkId,
                                    name: templName,
                                    description: 'Some description',
                                    html_content: htmlContent,
                                    marketing_content: 'Some marketing_content',
                                    updated_at: curDate,
                                    created_at: curDate
                                }, 'id')
                                .then(function (queryResult) {

                                    knex(TABLES.ATTACHMENTS)
                                        .insert({
                                            attacheable_id: queryResult[0],
                                            attacheable_type: 'template',
                                            name: originalFilename,
                                            key: key,
                                            updated_at: curDate,
                                            created_at: curDate
                                        })
                                        .then(function () {
                                            cB()
                                        })
                                        .catch(cB)
                                })
                                .catch(cB)

                        });

                        /!*key = computeKey();
                        fileName = computeFileName(originalFilename, key);
                        uploadOptions = {
                            folderName: bucket,
                            fileName: fileName,
                            originalFileName: originalFilename,
                            buffer: 'buffer'
                        };

                        uploader.uploadFile(uploadOptions, function (err) {
                            if (err) {
                                return cB(err);
                            }

                            knex(TABLES.TEMPLATES)
                                .insert({
                                    link_id: linkId,
                                    name: templName,
                                    description: 'Some description',
                                    html_content: htmlContent,
                                    marketing_content: 'Some marketing_content',
                                    updated_at: curDate,
                                    created_at: curDate
                                }, 'id')
                                .then(function (queryResult) {

                                    knex(TABLES.ATTACHMENTS)
                                        .insert({
                                            attacheable_id: queryResult[0],
                                            attacheable_type: 'template',
                                            name: originalFilename,
                                            key: key,
                                            updated_at: curDate,
                                            created_at: curDate
                                        })
                                        .then(function () {
                                            cB()
                                        })
                                        .catch(cB)
                                })
                                .catch(cB)
                        });
*!/

                    })*/

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
        createDefaultTemplates: createDefaultTemplates
    }
};