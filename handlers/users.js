'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;
var PERMISSIONS = require('../constants/permissions');

var async = require('async');
var _ = require('lodash');
var crypto = require('crypto');

var badRequests = require('../helpers/badRequests');
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');

var SessionHandler = require('../handlers/sessions');
var ProfilesHandler = require('../handlers/profiles');
var CompaniesHandler = require('../handlers/companies');
var ImagesHandler = require('../handlers/images');
var VALID_PERMISSIONS = _.values(PERMISSIONS);

var UsersHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var ProfileModel = Models.Profile;
    var session = new SessionHandler(PostGre);
    var profilesHandler = new ProfilesHandler(PostGre);
    var companiesHandler = new CompaniesHandler(PostGre);
    var imageHandler = new ImagesHandler(PostGre);
    var self = this;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };

    function removeUser(options, callback) {
        var userId;
        var userModel;

        if (options && (typeof options === 'number')) {
            userId = options;
        }

        if (options && (options instanceof UserModel)) {
            userModel = options;
        }

        if (!userId && !userModel) {
            //todo: invalid incoming params
            return console.error(badRequests.NotEnParams());
        }

        if (userModel) {
            userModel.destroy().exec(callback);
        } else {
            UserModel
                .forge({
                    id: userId
                })
                .fetch()
                .exec(function (err, userModel) {
                    if (err) {
                        if (callback && (typeof callback === 'function')) {
                            callback(err);
                        }

                    } else {
                        userModel.destroy().exec(callback);
                    }
                });
        }
    };

    function updateUserById(userId, options, callback) {
        var profile = options.profile;
        var profileData = {};

        if (options.profile) {
            profile = options.profile;

            if (profile.first_name) {
                profileData.first_name = profile.first_name;
            }
            if (profile.last_name) {
                profileData.last_name = profile.last_name;
            }
            if (profile.phone !== undefined) {
                profileData.phone = profile.phone;
            }
            if (profile.permissions !== undefined) {

                if (VALID_PERMISSIONS.indexOf(profile.permissions) === -1) {
                    return callback(badRequests.InvalidValue({message: 'Invalid value for "permissions"'}));
                }

                profileData.permissions = profile.permissions;
            }
        }

        if (Object.keys(profileData).length === 0) {
            return callback(badRequests.NotEnParams({message: 'There are no params for update'}));
        }

        async.waterfall([

            //find the user:
            function (cb) {
                var criteria = {
                    id: userId
                };
                var fetchOptions = {
                    require: true,
                    withRelated: ['profile', 'avatar']
                };

                UserModel.find(criteria, fetchOptions).exec(function (err, userModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, userModel);
                });
            },

            //save the profile:
            function (userModel, cb) {
                var profileModel = userModel.related('profile');

                profileModel
                    .save(profileData, {patch: true})
                    .exec(function (err, profileModel) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, userModel);
                    });
            }


        ], function (err, userModel) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, userModel);
                }
            }
        });
    };

    this.signUp = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var password = options.password;
        var company = options.company;
        var confirmToken;
        var userData;

        //validate options:
        if (!email || !password || !company) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'password', 'company']}));
        }

        //email validation:
        if (!EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        async.waterfall([

            //check unique email:
            function (cb) {
                var criteria = {
                    email: email
                };

                UserModel
                    .find(criteria)
                    .exec(function (err, userModel) {
                        if (err) {
                            return cb(err);
                        }
                        if (userModel && userModel.id) {
                            return cb(badRequests.EmailInUse());
                        }
                        cb(); //all right:
                    });
            },

            //create a new user:
            function (cb) {
                confirmToken = tokenGenerator.generate();
                userData = {
                    email: email,
                    password: getEncryptedPass(password),
                    confirm_token: confirmToken
                };

                UserModel.upsert(userData, function (err, userModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, userModel);
                });
            },

            //save the profile:
            function (userModel, cb) {
                var userId = userModel.id;
                var profileData = profilesHandler.prepareSaveData(options);

                profileData.user_id = userId;
                profileData.permissions = PERMISSIONS.OWNER;
                ProfileModel.upsert(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    userModel.set('profile', profileModel);
                    cb(null, userModel);
                });
            },

            //create a new company with ower:
            function (userModel, cb) {
                var companyOptions = {
                    userId: userModel.id,
                    name: company
                };
                //cb(null, userModel);

                companiesHandler.createCompanyWithOwner(companyOptions, function (err, company) {
                    if (err) {
                        //return console.error(err);
                        return cb(err);
                    }
                    cb(null, userModel);
                });
            }

        ], function (err, userModel) {
            var mailerOptions;

            if (err) {
                return next(err);
            }

            mailerOptions = {
                email: email,
                confirmToken: confirmToken
            };
            mailer.onSendConfirm(mailerOptions);

            res.status(201).send({success: MESSAGES.SUCCESS_REGISTRATION_MESSAGE});
        });

    };

    this.signIn = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var password = options.password;
        var criteria;
        var fetchOptions;

        if (!email || !password) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'password']}));
        }

        criteria = {
            email: email,
            password: getEncryptedPass(password)
        };
        fetchOptions = {
            withRelated: ['profile', 'company']
        };

        UserModel
            .find(criteria, fetchOptions)
            .exec(function (err, userModel) {
                var profile;
                var company;
                var companyId;
                var sessionOptions;

                if (err) {
                    return next(err);
                }

                if (!userModel || !userModel.id) {
                    return next(badRequests.SignInError());
                }

                if (userModel && userModel.get('confirm_token')) {
                    return next(badRequests.UnconfirmedEmail());
                }

                profile = userModel.related('profile');
                company = userModel.related('company');

                if (company && company.models.length && company.models[0].id) {
                    companyId = company.models[0].id;
                }

                sessionOptions = {
                    permissions: profile.get('permissions'),
                    companyId: companyId
                };
                session.register(req, res, userModel, sessionOptions);
            });
    };

    this.confirmEmail = function (req, res, next) {
        var confirmToken = req.params.confirmToken;

        async.waterfall([

            //try to find the user by confirmToken:
            function (cb) {
                var criteria = {
                    confirm_token: confirmToken
                };

                UserModel
                    .forge(criteria)
                    .fetch()
                    .exec(function (err, userModel) {
                        if (err) {
                            return cb(err);
                        }

                        if (!userModel || !userModel.id) {
                            return cb(badRequests.NotFound());
                        }

                        cb(null, userModel);
                    });
            },

            //set the confirm_token = null:
            function (userModel, cb) {
                var saveData = {
                    confirm_token: null
                };

                userModel
                    .save(saveData, {patch: true})
                    .exec(function (err, updatedUser) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, updatedUser);
                    });
            }

        ], function (err, userModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: MESSAGES.SUCCESS_EMAIL_CONFIRM});
        });
    };

    this.getCurrentUser = function (req, res, next) {
        var userId = req.session.userId;
        var criteria = {
            id: userId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['profile', 'company', 'avatar']
        };

        UserModel
            .find(criteria, fetchOptions)
            .then(function (userModel) {
                res.status(200).send(userModel);
            })
            .catch(UserModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.changeProfile = function (req, res, next) {
        var userId = req.session.userId;
        var options = {};
        var image = {};

        image.imageSrc = req.body.imageSrc;
        image.imageable_id = userId;
        image.imageable_type = 'users';
        options.profile = req.body;
        //var permissions;


        /*//check permissions:
         if ((options.profile && (options.profile.permissions !== undefined))) {
         permissions = options.profile.permissions;

         if (!session.isAdmin(req) || (permissions < req.session.permissions)) {
         return next(badRequests.AccessError());
         }
         }*/

        async.waterfall([

            //update user profile
            function (cb) {
                updateUserById(userId, options, function (err, userModel) {
                    if (!err) {
                        image.id = userModel.relations.avatar.attributes.id;
                        image.oldName = userModel.relations.avatar.attributes.name;
                        image.oldKey = userModel.relations.avatar.attributes.key;
                    }
                    cb(err, userModel);
                });
            },

            //update users avatar
            function (userModel, cb) {
                if (image && image.imageable_id && image.imageable_type && image.imageSrc) {
                    imageHandler.saveImage(image, function (err) {
                        cb(err, userModel);

                    });
                } else {
                    cb();
                }
            }

        ], function (err, userModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'success updated', user: userModel});

        });

        //==================================================================
        /*async.waterfall([

         //update user profile
         function (cb) {
         updateUserById(userId, options, function (err, userModel) {
         cb(err, userModel);
         });
         },

         //update users avatar
         function (userModel, cb) {
         if (image && image.imageable_id && image.imageable_type && image.imageSrc) {
         imageHandler.saveImage(image, function (err) {
         if (err) {
         cb(err);
         } else {
         cb(null, userModel);
         }

         });
         } else {
         cb(null, userModel);
         }
         }

         ], function (err, userModel) {
         if (err) {
         return next(err);
         }
         res.status(200).send({success: 'success updated', user: userModel});

         });*/

        //================================================================
        /*updateUserById(userId, options, function (err, userModel) {
         if (err) {
         return next(err);
         }

         if (image && image.imageable_id && image.imageable_type && image.imageSrc) {
         imageHandler.saveImage(image, function (err) {
         if (err) {
         return next(err)
         }

         });
         }
         ;

         res.status(200).send({success: 'success updated', user: userModel});
         });*/
    };

    this.forgotPassword = function (req, res, next) {
        var params = req.body;

        if (!params || !params.email) {
            return next(badRequests.NotEnParams({reqParams: 'email'}));
        }

        if (!EMAIL_REGEXP.test(params.email)) {
            return next(badRequests.InvalidEmail());
        }

        UserModel
            .forge({
                email: params.email
            })
            .fetch()
            .then(function (userModel) {
                var saveData = {
                    forgot_token: tokenGenerator.generate()
                };

                if (userModel && userModel.id) {

                    userModel
                        .save(saveData, {patch: true})
                        .then(function (user) {
                            var userJSON = user.attributes;

                            mailer.onForgotPassword(userJSON);
                            res.status(200).send({success: "success"});
                        })
                        .catch(next);

                } else {
                    res.status(200).send({success: "success"});
                }
            })
            .catch(next);
    };

    this.changePassword = function (req, res, next) {
        var params = req.body;
        var forgotToken = req.params.forgotToken;

        if (!params.password) {
            return next(badRequests.NotEnParams({reqParams: 'password'}));
        }

        UserModel
            .forge({
                forgot_token: forgotToken
            })
            .fetch({require: true})
            .then(function (userModel) {
                var saveOptions = {
                    password: getEncryptedPass(params.password),
                    forgot_token: null
                };

                userModel
                    .save(saveOptions, {patch: true})
                    .then(function () {
                        res.status(200).send({success: "Password was changed successfully"});
                    })
                    .catch(next);
            })
            .catch(UserModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.inviteUser = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var company;
        var userData;
        var userPassword;
        var invitedUserId;

        //validate options:
        if (!email) {
            return next(badRequests.NotEnParams({reqParams: ['email']}));
        }

        //email validation:
        if (!EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        if (!session.isAdmin(req)) {
            return next(badRequests.AccessError())
        }

        async.waterfall([

            //check unique email:
            function (cb) {
                var criteria = {
                    email: email
                };

                UserModel
                    .find(criteria)
                    .exec(function (err, userModel) {
                        if (err) {
                            return cb(err);
                        }
                        if (userModel && userModel.id) {
                            return cb(badRequests.EmailInUse());
                        }
                        cb(); //all right:
                    });
            },

            //invite a new user:
            function (cb) {
                userPassword = tokenGenerator.generate(6);
                userData = {
                    email: email,
                    password: getEncryptedPass(userPassword)
                };

                UserModel.upsert(userData, function (err, userModel) {
                    if (err) {
                        return cb(err);
                    }
                    invitedUserId = userModel.id;
                    cb(null, userModel);
                });
            },

            //save the profile:
            function (userModel, cb) {
                var userId = userModel.id;
                var profileData = profilesHandler.prepareSaveData(options);

                profileData.user_id = userId;
                profileData.permissions = options.permissions;
                ProfileModel.upsert(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    userModel.set('profile', profileModel);
                    cb(null, userModel);
                });
            },

            //add current user to company
            function (userModel, cb) {
                var userId = userModel.id;
                var companyId = req.session.companyId;
                var companyData = {
                    userId: userId,
                    companyId: companyId
                };
                companiesHandler.insertIntoUserCompanies(companyData, function (err, resultModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, userModel);
                })
            }

        ], function (err, userModel) {
            var mailerOptions;

            if (err) {
                if (invitedUserId) {
                    removeUser(invitedUserId);
                }
                return next(err);
            }

            mailerOptions = {
                email: email,
                userPassword: userPassword
            };
            mailer.onUserInvite(mailerOptions);

            res.status(201).send({success: MESSAGES.SUCCESS_INVITE_MESSAGE});
        });

    };

    this.getUsers = function (req, res, next) {
        var options = req.query;
        var userId = req.session.userId;
        var companyId = req.session.companyId;
        var queryOptions = { //TODO: query options page, count, orderBy ...
            companyId: companyId
        };
        var fetchOptions = {
            withRelated: ['profile']
        };

        UserModel
            .findCollaborators(queryOptions, fetchOptions)
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result.models);
            });
    };

    this.getUser = function (req, res, next) {
        var userId = req.params.id;
        var companyId = req.session.companyId;
        var queryOptions = {
            userId: userId,
            companyId: companyId
        };
        var fetchOptions = {
            require: true,
            withRelated: ['profile']
        };

        UserModel
            .findCollaborator(queryOptions, fetchOptions)
            .then(function (userModel) {
                res.status(200).send(userModel);
            })
            .catch(UserModel.NotFoundError, function () {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.updateUser = function (req, res, next) {
        var userId = req.params.id;
        var options = req.body;
        var currentUserId = req.session.userId;
        var permissions;

        //check permissions:
        if ((options.profile && (options.profile.permissions !== undefined))) {
            permissions = options.profile.permissions;

            if (!session.isAdmin(req) || (permissions < req.session.permissions)) {
                return next(badRequests.AccessError());
            }
        }

        updateUserById(userId, options, function (err, userModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'success updated', user: userModel});
        });
    };

    this.renderError = function (err, req, res, next) {
        res.render('errorTemplate', {error: err});
    };
};

module.exports = UsersHandler;