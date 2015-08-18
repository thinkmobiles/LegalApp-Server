'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');

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
    var MessageModel = Models.Message;
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
        var profile;
        var profileData = {};
        var userData = {};

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

        if (options.status !== undefined) {
            userData.status = options.status;
        }

        if ((Object.keys(profileData).length === 0) && (Object.keys(userData).length === 0)) {
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

                if (userModel && userModel.get('status') === STATUSES.DELETED) {
                    return next(badRequests.AccessError({message: MESSAGES.DELETED_ACCOUNT, status: 403}));
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

    this.firstSignIn = function (req, res, next) {
        var forgotToken = req.params.inviteToken;
        var options = req.body;
        var password = options.password;

        if (!password) {
            return next(badRequests.NotEnParams({reqParams: ['password']}));
        }

        async.waterfall([

            //try to find the user by forgot_token:
            function (cb) {
                var criteria = {
                    forgot_token: forgotToken
                };

                UserModel
                    .forge(criteria)
                    .fetch({withRelated : ['profile', 'company']})
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

            //set "new password" and forgot_token = null:
            function (userModel, cb) {
                var saveData = {
                    forgot_token: null,
                    password: getEncryptedPass(password)
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

            profile = userModel.related('profile');
            company = userModel.related('company');

            if (company && company.models.length && company.models[0].id) {
                companyId = company.models[0].id;
            }

            sessionOptions = {
                permissions: profile.get('permissions'),
                companyId  : companyId
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
        var options = req.body;
        var image = {};
        var permissions;

        //check permissions:
        if ((options.profile && (options.profile.permissions !== undefined))) {
            permissions = options.profile.permissions;

            if (!session.isAdmin(req) || (permissions < req.session.permissions)) {
                return next(badRequests.AccessError());
            }
        }

        if (options.imageSrc) {
            image.imageSrc = req.body.imageSrc;
            image.imageable_id = userId;
            image.imageable_type = 'users';
        }

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
        var companyId = options.companyId;
        var permissions = options.permissions;

        //var company;
        var userData;
        var forgotToken;
        var invitedUserId;

        //validate options:
        if (!email || (permissions === undefined)) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'permissions']}));
        }

        //email validation:
        if (!EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        if (session.isAdmin(req)) {
            companyId = options.companyId || req.session.companyId;
        } else if (session.isClientAdmin(req)) {
            companyId = req.session.companyId;
        } else {
            return next(badRequests.AccessError());
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
                forgotToken = tokenGenerator.generate();
                userData = {
                    email: email,
                    forgot_token: forgotToken
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
                var companyData = {
                    userId   : userId,
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
                resetToken: forgotToken
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
            withRelated: ['profile', 'avatar']
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

    this.getClients = function (req, res, next) {
        var options = req.query;
        var userId = req.session.userId;
        var companyId = req.session.companyId;
        var queryOptions = { //TODO: query options page, count, orderBy ...
            withoutCompany: companyId
        };
        var fetchOptions = {
            withRelated: ['profile', 'avatar', 'company']
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
            withRelated: ['profile', 'avatar']
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

    this.searchUsers = function (req, res, next) {
        next(badRequests.AccessError({message: 'Not implemented yet'}));
    };

    this.renderError = function (err, req, res, next) {
        res.render('errorTemplate', {error: err});
    };

    this.helpMe = function (req, res, next){
        var options = req.body;
        var mailerOptions;
        var userId = req.session.userId;
        var fetchOptions;
        var email = options.email;
        var subject = options.subject;
        var text = options.emailText;
        var criteria = {
            id: userId
        };

        fetchOptions = {
            require: true,
            withRelated: ['profile', 'company']
        };

        mailerOptions = {
            email   : email,
            subject : subject,
            text    : text
        };

        UserModel
            .find(criteria, fetchOptions)
            .exec(function(err, userModel){
                if (err) {
                    return next(err);
                }

                var saveData;
                var profile = userModel.related('profile');
                var company = userModel.related('company');

                mailerOptions.name = profile.get('first_name')+' '+profile.get('last_name');

                if (company && company.models.length && company.models[0].id) {
                    mailerOptions.company = company.models[0].get('name');
                }

                saveData = {
                    owner_id : userId,
                    email    : email,
                    subject  : subject,
                    body     : text
                };

                MessageModel
                    .upsert(saveData,function (err, updatedModel) {
                        if (err) {
                            return next(err);
                        }
                    });

                mailer.helpMeMessage(mailerOptions);
                res.status(200).send({success : 'success'});
            })
    }
};

module.exports = UsersHandler;