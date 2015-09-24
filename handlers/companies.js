'use strict';

var CONSTANTS = require('../constants/index');
var PERMISSIONS = require('../constants/permissions');
var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');

var async = require('async');
var badRequests = require('../helpers/badRequests');

var ImagesHandler = require('../handlers/images');

var CompaniesHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var CompanyModel = Models.Company;
    var ImageModel = Models.Image;
    var imageHandler = new ImagesHandler(PostGre);
    var imageUploader = ImageModel.uploader;
    var self = this;

    function prepareData(saveData) {
        var saveOptions = {};

        if (saveData && saveData.name) {
            saveOptions.name = saveData.name;
        }
        if (saveData && saveData.email) {
            saveOptions.email = saveData.email;
        }
        if (saveData && saveData.country) {
            saveOptions.country = saveData.country;
        }
        if (saveData && saveData.city) {
            saveOptions.city = saveData.city;
        }
        if (saveData && saveData.address) {
            saveOptions.address = saveData.address;
        }

        return saveOptions;
    }

    function saveLogo(companyId, imageSrc, callback) {
        var searchOptions = {
            imageable_id: companyId,
            imageable_type: TABLES.COMPANIES
        };

        /*async.waterfall([

                //try to find the attachmentModel:
                function (cb) {
                    Models.Attachment
                        .forge()
                        .query(function (qb) {
                            qb.where(searchOptions);
                        })
                        .fetch()
                        .exec(function (err, attachmentModel) {
                            if (err) {
                                return callback(err);
                            }

                            if (!attachmentModel || !attachmentModel.id) {
                                attachmentModel = Models.Attachment.forge(searchOptions);
                            }

                            cb(null, attachmentModel);
                        });
                },

                //try to remove the old file;
                function (attachmentModel, cb) {

                },

                //save the new file:
                function (attachmentModel, cb) {

                },

                // create / update the attachmentModel
                function (attachmentModel, options, cb) {

                }
            ],

            function (err, model, url) {
                if (err) {
                    return callback(err);
                }
                callback(null, url);
            });*/

        Models.Image
            .forge()
            .query(function (qb) {
                qb.where(searchOptions);
            })
            .fetch()
            .exec(function (err, logoModel) {
                var logoJSON;

                if (err) {
                    return callback(err);
                }

                if (!logoModel || !logoModel.id) {
                    logoModel = Models.Image.forge(searchOptions);
                }

                logoJSON = logoModel.attributes;
                logoJSON.imageSrc = imageSrc;
                logoJSON.oldName = logoJSON.name;
                logoJSON.oldKey = logoJSON.key;

                imageHandler.saveImage(logoJSON, function (err, imageModel) {
                    var logoUrl;
                    var logoName;
                    var logoKey;
                    var bucket = BUCKETS.LOGOS;

                    if (err) {
                        return callback(err);
                    }

                    logoName = imageModel.attributes.name;
                    logoKey = imageModel.attributes.key;
                    logoUrl = Models.Image.getImageUrl(logoName, logoKey, bucket);

                    callback(null, logoUrl);
                });
            });
    };

    this.createCompanyWithOwner = function (options, callback) {
        var userId = options.userId;
        var createData = {
            owner_id: userId,
            name: options.name
        };

        CompanyModel
            .forge(createData)
            .save()
            .exec(function (err, companyModel) {
                if (err) {
                    if (callback && (typeof callback === 'function')) {
                        callback(err);
                    }
                } else {
                    if (callback && (typeof callback === 'function')) {
                        callback(null, companyModel);
                    }
                }
            });
    };

    this.newCompany = function (req, res, next) {
        var userId = req.session.userId;
        var options = req.body;
        var companyName = options.name;
        var createOptions;

        if (!companyName) {
            return next(badRequests.NotEnParams({reqParams: ['name']}));
        }

        createOptions = {
            userId: userId,
            name: companyName
        };

        self.createCompanyWithOwner(createOptions, function (err, companyModel) {
            if (err) {
                return next(err);
            }
            res.status(201).send({success: 'created', model: companyModel});
        });
    };

    this.getCompanies = function (req, res, next) {
        var options = req.query;
        var searchTerm = options.search;
        var page = req.query.page || 1;
        var limit = req.query.count;// || 10;

        CompanyModel
            .forge()
            .query(function (qb) {
                if (searchTerm) {
                    searchTerm = searchTerm.toLowerCase();
                    qb.whereRaw(
                        "LOWER(name) LIKE '%" + searchTerm + "%' "
                    );
                }

                if (page && limit) {
                    qb.offset(( page - 1 ) * limit)
                        .limit(limit);
                }
            })
            .fetchAll()
            .then(function (rows) {
                res.status(200).send(rows);
            })
            .catch(next);
    };

    this.getCompany = function (req, res, next) {
        var companyId = req.params.id;
        var criteria = {
            id: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['logo']
        };

        // return AccessError if not SuperAdmin and not Admin and companyId !== session.companyId:
        if (req.session.permissions !== PERMISSIONS.SUPER_ADMIN && req.session.permissions !== PERMISSIONS.ADMIN && (req.session.companyId) != companyId) {
            return next(badRequests.AccessError());
        }

        CompanyModel
            .find(criteria, fetchOptions)
            .then(function (companyModel) {
                res.status(200).send(companyModel);
            })
            .catch(CompanyModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);

    };

    this.getAllCompanies = function (req, res, next) {
        var permissions = req.session.permissions;
        var companyId = req.session.companyId;
        var queryOptions;
        var fetchOptions = {
            withRelated: 'logo'
        };

        if (!((permissions === PERMISSIONS.SUPER_ADMIN) || (permissions === PERMISSIONS.ADMIN))) {
            queryOptions = {
                id: companyId
            };
        }

        CompanyModel
            .forge()
            .query(function (qb) {
                if (queryOptions) {
                    qb.where(queryOptions);
                }
            })
            .fetchAll(fetchOptions)
            .then(function (companiesModels) {
                res.status(200).send(companiesModels);
            })
            .catch(next)
    };

    this.updateCompany = function (req, res, next) {
        var companyId = req.params.id;
        var permissions = req.session.permissions;
        var options = req.body;
        var imageSrc = options.imageSrc;
        var saveData;

        if ((permissions === PERMISSIONS.SUPER_ADMIN) ||
            (permissions === PERMISSIONS.ADMIN) ||
            ((permissions === PERMISSIONS.CLIENT_ADMIN) && (companyId === req.session.companyId))) {

            saveData = prepareData(options);
        } else {
            return next(badRequests.AccessError());
        }

        /*if ((!Object.keys(saveData).length) && !imageSrc) {
            return next(badRequests.NotEnParams({message: 'Nothing to modify'}))
        }*/

        //try to find the company:
        var criteria = {
            id: companyId
        };
        var fetchOptions = {
            require: true
        };

        CompanyModel
            .find(criteria, fetchOptions)
            .then(function (companyModel) {

                async.parallel({

                    //try to update the company:
                    updatedCompanyModel: function (cb) {

                        if ((!Object.keys(saveData).length)) {
                            return cb(null, companyModel);
                        }

                        companyModel
                            .save(saveData, {patch: true})
                            .exec(function (err, updatedModel) {
                                if (err) {
                                    return cb(err);
                                }
                                cb(null, updatedModel);
                            });
                    },

                    //try to update the logo:
                    logoUrl: function (cb) {
                        if (imageSrc === undefined) {
                            return cb(null, null);
                        }

                        saveLogo(companyId, imageSrc, function (err, logoUrl) {
                            if (err) {
                                return cb(err);
                            }
                            cb(null, logoUrl);
                        });
                    }

                }, function (err, results) {
                    var updatedCompanyModel;
                    var logoUrl;
                    var companyJSON;

                    if (err) {
                        return next(err);
                    }

                    updatedCompanyModel = results.updatedCompanyModel;
                    logoUrl = results.logoUrl;

                    companyJSON = updatedCompanyModel.toJSON();

                    if (imageSrc) {
                        companyJSON.logo = {
                            url: logoUrl
                        };
                    }

                    res.status(200).send({success: 'success updated', company: companyJSON});
                });
            })
            .catch(CompanyModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.updateCompany_old = function (req, res, next) {
        var updateCompanyId = req.params.id;
        var permissions = req.session.permissions;
        var companyId = req.session.companyId;
        var options = req.body;
        var imageSrc = options.imageSrc;
        var saveData;
        var logo = {};

        if ((permissions === PERMISSIONS.SUPER_ADMIN) ||
            (permissions === PERMISSIONS.ADMIN) ||
            ((permissions === PERMISSIONS.CLIENT_ADMIN) && (updateCompanyId === companyId))) {

            saveData = prepareData(options);
            saveData.id = updateCompanyId;
        } else {
            return next(badRequests.AccessError());
        }

        if (imageSrc) {
            logo.imageSrc = imageSrc;
            logo.imageable_id = updateCompanyId;
            logo.imageable_type = 'companies';
        }

        if ((Object.keys(saveData).length === 1) && !imageSrc) {
            return next(badRequests.NotEnParams({message: 'Nothing to modify'}))
        }

        //try to modify company
        CompanyModel
            .upsert(saveData, function (err, companyModel) {
                var LogoModel;
                var fetchOptions = {
                    imageable_id: updateCompanyId,
                    imageable_type: 'companies'
                };

                if (err) {
                    return next(err);
                }

                if (!logo.imageSrc) {
                    return res.status(200).send({success: 'success updated', company: companyModel});
                }

                LogoModel = companyModel.related('logo');

                LogoModel
                    .fetch(fetchOptions)
                    .exec(function (err, logoModel) {
                        var jsonLogoModel;

                        if (err) {
                            return next(err);
                        }

                        jsonLogoModel = logoModel.toJSON();

                        logo.id = jsonLogoModel.id;
                        logo.oldName = jsonLogoModel.name;
                        logo.oldKey = jsonLogoModel.key;

                        imageHandler.saveImage(logo, function (err, imageModel) {
                            var logoUrl;
                            var logoName;
                            var logoKey;
                            var bucket = BUCKETS.LOGOS;
                            var jsonCompanyModel = companyModel.toJSON();

                            if (err) {
                                return next(err);
                            }

                            logoName = imageModel.attributes.name;
                            logoKey = imageModel.attributes.key;
                            logoUrl = Models.Image.getImageUrl(logoName, logoKey, bucket);
                            jsonCompanyModel.logo.url = logoUrl;

                            res.status(200).send({success: 'success updated', company: jsonCompanyModel});
                        });
                    });
            });
    };
};

module.exports = CompaniesHandler;