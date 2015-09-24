'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;
var PERMISSIONS = require('../constants/permissions');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

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
    var knex = PostGre.knex;
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var ProfileModel = Models.Profile;
    var MessageModel = Models.Message;
    var SecretKeyModel = Models.SecretKey;
    var session = new SessionHandler(PostGre);
    var profilesHandler = new ProfilesHandler(PostGre);
    var companiesHandler = new CompaniesHandler(PostGre);
    var imageHandler = new ImagesHandler(PostGre);
    var self = this;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    }

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
    }

    function updateUserById(userId, options, callback) {
        var profile;
        var profileData = {};
        var userData = {};
        var criteria;
        var fetchOptions;
        var signatureData = {};
        var passwordData = {};
        var signImage;

        if (options.sign_image !== undefined) {
            signImage = options.sign_image;
            signatureData.sign_image = signImage;

            if (signImage) {
                profileData.has_sign_image = true;
            } else {
                profileData.has_sign_image = false;
            }
        }

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
            if (profile.sign_authority !== undefined) {
                profileData.sign_authority = profile.sign_authority;
            }

        }

        if (options.status !== undefined) {
            userData.status = options.status;
        }

        if (options.password && options.newPassword) {
            passwordData.password = options.password;
            passwordData.newPassword = options.newPassword;
        }

        if ((Object.keys(profileData).length === 0) && (Object.keys(userData).length === 0) &&
            (Object.keys(signatureData).length === 0) && (Object.keys(passwordData).length === 0)) {
            return callback(badRequests.NotEnParams({message: 'There are no params for update'}));
        }

        criteria = {
            id: userId
        };

        fetchOptions = {
            require: true,
            withRelated: ['profile', 'avatar']
        };

        //try to find the user:
        UserModel
            .find(criteria, fetchOptions)
            .then(function (userModel) {

                //want to change password / look can we do this or not
                if (passwordData && passwordData.password && passwordData.newPassword) {
                    var oldPassword = passwordData.password;
                    var newPassword = passwordData.newPassword;
                    var userPassword = userModel.get('password');
                    var oldEncryptedPassword = getEncryptedPass(oldPassword);

                    if (userPassword === oldEncryptedPassword) {
                        userData.password = getEncryptedPass(newPassword);
                    } else {
                        return callback(badRequests.InvalidValue({message: 'Invalid password'}))
                    }
                }
                //try to update parallel the users and the profiles table:
                async.parallel({

                    //update the user's table:
                    updatedUser: function (cb) {

                        if (Object.keys(userData).length === 0) {
                            return cb(null, userModel); //nothing to update
                        }

                        userModel
                            .save(userData, {patch: true})
                            .exec(function (err, model) {
                                if (err) {
                                    return cb(err);
                                }
                                cb(null, model);
                            });
                    },

                    //save the profile:
                    updatedProfile: function (cb) {
                        var profileModel = userModel.related('profile');

                        if (Object.keys(profileData).length === 0) {
                            return cb(null, profileModel); //nothing to update
                        }

                        profileModel
                            .save(profileData, {patch: true})
                            .exec(function (err, model) {
                                if (err) {
                                    return cb(err);
                                }
                                cb(null, model);
                            });
                    },

                    //save the signature
                    updatedSignature: function (cb) {
                        var criteria = {
                            user_id: userId
                        };

                        if (Object.keys(signatureData).length === 0) {
                            return cb(null, null); //nothing to update
                        }

                        SecretKeyModel
                            .find(criteria)
                            .exec(function (err, secretKeyModel) {
                                var model;

                                if (err) {
                                    return cb(err);
                                }

                                if (secretKeyModel && secretKeyModel.id) {
                                    model = secretKeyModel;
                                } else {
                                    model = SecretKeyModel.forge({
                                        user_id: userId,
                                        secret_key: tokenGenerator.generate(20)
                                    })
                                }

                                model
                                    .save(signatureData, {patch: true})
                                    .exec(function (err, savedModel) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        cb(null, savedModel);
                                    });
                            });
                    }


                }, function (err, results) {
                    var updatedUser = results.updatedUser;

                    if (err) {
                        if (callback && (typeof callback === 'function')) {
                            callback(err);
                        }
                    } else {
                        if (callback && (typeof callback === 'function')) {
                            callback(null, updatedUser);
                        }
                    }
                });

            }
        )
            .
            catch(UserModel.NotFoundError, function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(badRequests.NotFound());
                }
            })
            .catch(function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            });
    }

    function normalizeUser(user, callback) {
        var userJSON = {
            id: user.id,
            email: user.email,
            status: user.status,
            profile: {
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                permissions: user.permissions,
                sign_authority: user.sign_authority,
                has_sign_image: user.has_sign_image
            },
            company: {
                id: user.company_id,
                name: user.company_name
            }
        };

        if (callback && (typeof callback === 'function')) {
            callback(null, userJSON);
        } else {
            return userJSON;
        }
    }

    function mapUsers(rows, callback) {
        async.map(rows, normalizeUser, function (err, userModels) {
            if (err) {
                return callback(err);
            }
            callback(null, userModels);
        });
    }

    function getUsersByCriteria(queryOptions, callback) {
        var userId;
        var companyId;
        var withoutCompany;
        var columns = [
            TABLES.PROFILES + '.first_name',
            TABLES.PROFILES + '.last_name',
            TABLES.PROFILES + '.phone',
            TABLES.PROFILES + '.permissions',
            TABLES.PROFILES + '.sign_authority',
            TABLES.PROFILES + '.has_sign_image',
            TABLES.COMPANIES + '.id as company_id',
            TABLES.COMPANIES + '.name as company_name',
            TABLES.USERS + '.email',
            TABLES.USERS + '.status',
            TABLES.USERS + '.id'
        ];
        var page = queryOptions.page || 1;
        var limit = queryOptions.count || 20;
        var orderBy = queryOptions.orderBy || (TABLES.PROFILES + '.first_name');
        var order = queryOptions.order || 'ASC';
        var query;

        if (queryOptions && queryOptions.companyId) {
            companyId = queryOptions.companyId;
        }

        if (queryOptions && queryOptions.userId) {
            userId = queryOptions.userId;
        }

        if (queryOptions && queryOptions.withoutCompany) {
            withoutCompany = queryOptions.withoutCompany;
        }

        if (process.env.NODE_ENV !== 'production') {
            console.time('>>> get usersKnex time');
        }

        query = knex(TABLES.USERS)
            .innerJoin(TABLES.PROFILES, TABLES.USERS + '.id', TABLES.PROFILES + '.user_id')
            .innerJoin(TABLES.COMPANIES, TABLES.COMPANIES + '.id', TABLES.PROFILES + '.company_id')
            .select(columns);

        if (withoutCompany) {
            query.andWhere(TABLES.PROFILES + '.company_id', '<>', withoutCompany)
        }

        if (companyId) {
            query.andWhere(TABLES.PROFILES + '.company_id', companyId);
        }

        if (userId) {
            query.andWhere(TABLES.USERS + '.id', userId);
        }

        if (page && limit) {
            query
                .offset(( page - 1 ) * limit)
                .limit(limit);
        }

        query
            .orderBy(orderBy, order)
            .exec(function (err, rows) {
                if (process.env.NODE_ENV !== 'production') {
                    console.timeEnd('>>> get usersKnex time');
                }

                if (err) {
                    return callback(err);
                }

                if (process.env.NODE_ENV !== 'production') {
                    console.time('>>> map usersKnex time');
                }

                mapUsers(rows, function (err, userModels) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.timeEnd('>>> map usersKnex time');
                    }

                    if (err) {
                        return callback(err);
                    }
                    callback(null, userModels);
                });
            });

    };

    this.getUsersByCriteria = getUsersByCriteria;

    this.signUp = function (req, res, next) {
        var app = req.app;
        var io = app.get('io');
        var options = req.body;
        var email = options.email;
        var companyName = options.company;
        var forgotToken;
        var userData;
        var status = STATUSES.NOT_CONFIRMED;

        //validate options:
        if (!email || !companyName) {
            return next(badRequests.NotEnParams({reqParams: ['email', /*'password',*/ 'company']}));
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
                forgotToken = tokenGenerator.generate();
                userData = {
                    email: email,
                    status: status,
                    forgot_token: forgotToken
                };

                UserModel.upsert(userData, function (err, userModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, userModel);
                });
            },

            //create a new company with owner:
            function (userModel, cb) {
                var companyOptions = {
                    userId: userModel.id,
                    name: companyName
                };

                companiesHandler.createCompanyWithOwner(companyOptions, function (err, companyModel) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, userModel, companyModel);
                });
            },

            //save the profile:
            function (userModel, companyModel, cb) {
                var userId = userModel.id;
                var profileData = profilesHandler.prepareSaveData(options);

                profileData.user_id = userId;
                profileData.permissions = PERMISSIONS.CLIENT_ADMIN;
                profileData.company_id = companyModel.id;
                ProfileModel.upsert(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    cb(null, userModel);
                });
            },

            //create a secret key:
            function (userModel, cb) {
                var saveSecretKeyData = {
                    user_id: userModel.id,
                    secret_key: tokenGenerator.generate(20)
                };

                SecretKeyModel
                    .forge(saveSecretKeyData)
                    .save()
                    .exec(function (err, secretKeyModel) {
                        if (err) {
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
                email: email
            };

            mailer.onSignUp(mailerOptions);
            io.emit('newUser', userModel);

            res.status(201).send({success: MESSAGES.SIGN_UP_ACCEPT});
        });
    };

    this.acceptUser = function (req, res, next) {
        var app = req.app;
        var io = app.get('io');
        var userId = req.params.id;
        var criteria = {
            id: userId,
            status: STATUSES.NOT_CONFIRMED
        };
        var fetchOptions = {
            require: true,
            withRelated: ['profile', 'company']
        };
        var saveData = {
            status: STATUSES.CREATED
        };

        UserModel
            .find(criteria, fetchOptions)
            .then(function (userModel) {
                userModel
                    .save(saveData, {patch: true})
                    .exec(function (err, updatedUserModel) {
                        var mailerOptions;

                        if (err) {
                            return next(err);
                        }

                        mailerOptions = {
                            email: updatedUserModel.get('email'),
                            forgot_token: updatedUserModel.get('forgot_token')
                        };

                        mailer.onAcceptUser(mailerOptions);

                        io.emit('acceptUser', updatedUserModel);

                        res.status(200).send({success: 'User request was accepted', model: updatedUserModel});
                    });
            })
            .catch(UserModel.NotFoundError, function (err) {
                return next(badRequests.NotFound());
            })
            .catch(next)
    };

    this.rejectUser = function (req, res, next) {
        var app = req.app;
        var io = app.get('io');
        var userId = req.params.id;
        var criteria = {
            id: userId,
            status: STATUSES.NOT_CONFIRMED
        };
        var fetchOptions = {
            require: true,
            withRelated: ['profile', 'company']
        };
        var saveData = {
            status: STATUSES.DELETED
        };

        UserModel
            .find(criteria, fetchOptions)
            .then(function (userModel) {
                userModel
                    .save(saveData, {patch: true})
                    .exec(function (err, updatedUserModel) {
                        var mailerOptions;

                        if (err) {
                            return next(err);
                        }

                        mailerOptions = {
                            email: updatedUserModel.get('email')
                        };

                        mailer.onRejectUser(mailerOptions);

                        io.emit('rejectUser', updatedUserModel);

                        res.status(200).send({success: 'User request was rejected'});
                    });
            })
            .catch(UserModel.NotFoundError, function (err) {
                return next(badRequests.NotFound());
            })
            .catch(next);

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
            withRelated: ['profile', 'company', 'avatar']
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

                if (userModel && userModel.get('status') === STATUSES.NOT_CONFIRMED) {
                    return next(badRequests.AccessError({
                        message: 'Your account is not confirmed by our team.',
                        status: 403
                    }))
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
                    companyId: companyId,
                    rememberMe: options.rememberMe
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
                    .fetch({withRelated: ['profile', 'company', 'avatar']})
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
                companyId: companyId,
                rememberMe: options.rememberMe
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
        var imageSrc = options.imageSrc;
        var avatar = {};
        var permissions;

        if (options.profile) {

            //check permissions:
            if (options.profile.permissions !== undefined) {
                permissions = options.profile.permissions;

                if (!session.isAdmin(req) || (permissions < req.session.permissions)) {
                    return next(badRequests.AccessError());
                }
            }

            //check sign_authority:
            if (options.profile.sign_authority !== undefined) {
                if (!session.isAdmin(req)) {
                    return next(badRequests.AccessError({message: 'Can\'t update the sign authority'}));
                }
            }
        }

        if (imageSrc) {
            avatar.imageSrc = imageSrc;
            avatar.imageable_id = userId;
            avatar.imageable_type = 'users';
        }

        async.waterfall([

            //update user:
            function (cb) {
                updateUserById(userId, options, function (err, userModel) {
                    if (!err) {
                        avatar.id = userModel.relations.avatar.attributes.id;
                        avatar.oldName = userModel.relations.avatar.attributes.name;
                        avatar.oldKey = userModel.relations.avatar.attributes.key;
                    }
                    cb(err, userModel);
                });
            },

            //update users avatar:
            function (userModel, cb) {
                if (!avatar.imageSrc) {
                    return cb();
                }

                imageHandler.saveImage(avatar, function (err, result) {
                    cb(err, userModel);
                });
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
                profileData.company_id = companyId;
                profileData.permissions = options.permissions;
                ProfileModel.upsert(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    cb(null, userModel);
                });
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

    this.getUser = function (req, res, next) {
        var userId = req.params.id;
        var companyId = req.session.companyId;
        var queryOptions = {
            userId: userId
        };

        getUsersByCriteria(queryOptions, function (err, rows) {
            if (err) {
                return next(err);
            }

            if (!rows || !rows.length) {
                return next(badRequests.NotFound({message: MESSAGES.NOT_FOUND_USER}));
            }

            res.status(200).send(rows[0]);
        });
    };

    this.getUsers = function (req, res, next) {
        var options = req.query;
        var companyId = req.session.companyId;
        var queryOptions = {
            page: options.page,
            count: options.count,
            orderBy: options.orderBy,
            order: options.order,
            companyId: companyId
        };

        getUsersByCriteria(queryOptions, function (err, rows) {
            if (err) {
                return next(err);
            }
            res.status(200).send(rows);
        });
    };

    this.getClients = function (req, res, next) {
        var options = req.query;
        var companyId = req.session.companyId;
        var queryOptions = {
            page: options.page,
            count: options.count,
            orderBy: options.orderBy,
            order: options.order,
            withoutCompany: companyId
        };

        getUsersByCriteria(queryOptions, function (err, rows) {
            if (err) {
                return next(err);
            }
            res.status(200).send(rows);
        });
    };

    this.updateUser = function (req, res, next) {
        var userId = req.params.id;
        var options = req.body;
        var signImage = options.sign_image;
        var permissions;

        //TODO: superAdmin can update other companies users data;

        //check permissions:
        if ((options.profile && (options.profile.permissions !== undefined))) {
            permissions = options.profile.permissions;

            if (!session.isAdmin(req) || (permissions < req.session.permissions)) {
                return next(badRequests.AccessError());
            }
        }

        if (signImage !== undefined) {

            if (req.session.permissions === PERMISSIONS.CLIENT_ADMIN) {
                return next(badRequests.AccessError());
            }

            if ((signImage !== null) && (!CONSTANTS.BASE64_REGEXP.test(signImage))) {
                return next(badRequests.InvalidValue({message: 'Invalid value of sign_image'}));
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
        var companyId = req.session.companyId;
        var params = req.query;
        var permissions = req.session.permissions;
        var searchTerm = params.value;
        var status = params.status;
        var signAuthority = params.signAuthority;
        var page = params.page || 1;
        var limit = params.count; //|| 10;
        var orderBy = params.orderBy || 'value';
        var order = params.order || 'ASC';
        var columns = [
            TABLES.USERS + '.id',
            TABLES.USERS + '.email',
            TABLES.USERS + '.status',
            TABLES.PROFILES + '.first_name',
            TABLES.PROFILES + '.last_name',
            TABLES.PROFILES + '.phone',
            TABLES.PROFILES + '.permissions',
            TABLES.PROFILES + '.sign_authority',
            TABLES.COMPANIES + '.id as company_id',
            TABLES.COMPANIES + '.name as company_name',
            knex.raw(
                "CONCAT(" + TABLES.PROFILES + ".first_name, ' ', " + TABLES.PROFILES + ".last_name) AS value"
            )
        ];

        var query;

        if (status) {
            status = parseInt(status);
            if (isNaN(status)) {
                return next(badRequests.InvalidValue({param: 'status', value: status}));
            }
        }

        query = knex(TABLES.USERS)
            .innerJoin(TABLES.PROFILES, TABLES.USERS + '.id', TABLES.PROFILES + '.user_id')
            .innerJoin(TABLES.COMPANIES, TABLES.COMPANIES + '.id', TABLES.PROFILES + '.company_id');

        query.where(function (qb) {

            if (status !== undefined) {
                this.where('status', status);
            } else {
                this.where('status', '<>', STATUSES.DELETED);
            }

            if (!session.isAdmin(req)) {
                this.where(TABLES.COMPANIES + '.id', companyId);
            }

            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                this.whereRaw(
                    "LOWER(first_name) LIKE '%" + searchTerm + "%' "
                    + "OR LOWER(last_name) LIKE '%" + searchTerm + "%' "
                    + "OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%" + searchTerm + "%' "
                );
            }

            if (signAuthority === 'true') {
                this.where('sign_authority', true);
            }

        });

        query
            .select(columns);

        if (page && limit) {
            query
                .offset(( page - 1 ) * limit)
                .limit(limit);
        }

        query
            .orderBy(orderBy, order)
            .exec(function (err, rows) {
                var users = [];

                if (err) {
                    return next(err);
                }

                if (params.format === 'single') {
                    return res.status(200).send(rows);
                }

                rows.forEach(function (row) {
                    row.profile = {
                        first_name: row.first_name,
                        last_name: row.last_name,
                        phone: row.phone,
                        permissions: row.permissions,
                        sign_authority: row.sign_authority
                    };

                    row.company = {
                        id: row.company_id,
                        name: row.company_name
                    };

                    delete row.first_name;
                    delete row.last_name;
                    delete row.phone;
                    delete row.permissions;
                    delete row.sign_authority;
                    delete row.company_id;
                    delete row.company_name;

                    users.push(row);
                });
                res.status(200).send(users);
            });
    };

    this.countUsers = function (req, res, next) {
        var companyId = req.session.companyId;
        var params = req.query;
        var permissions = req.session.permissions;
        var searchTerm = params.value;
        var status = params.status;
        var signAuthority = params.signAuthority;
        var query;

        if (status) {
            status = parseInt(status);
            if (isNaN(status)) {
                return next(badRequests.InvalidValue({param: 'status', value: status}));
            }
        }

        query = knex(TABLES.USERS)
            .innerJoin(TABLES.PROFILES, TABLES.USERS + '.id', TABLES.PROFILES + '.user_id')
            .innerJoin(TABLES.COMPANIES, TABLES.COMPANIES + '.id', TABLES.PROFILES + '.company_id');

        query.where(function () {

            if (status !== undefined) {
                this.where('status', status);
            } else {
                this.where('status', '<>', STATUSES.DELETED);
            }

            if (!session.isAdmin(req)) {
                this.where(TABLES.COMPANIES + '.id', companyId);
            }

            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                this.whereRaw(
                    "LOWER(first_name) LIKE '%" + searchTerm + "%' "
                    + "OR LOWER(last_name) LIKE '%" + searchTerm + "%' "
                    + "OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%" + searchTerm + "%' "
                );
            }

            if (signAuthority === 'true') {
                this.where('sign_authority', true);
            }
        });

        query
            .count('users.id')
            .exec(function (err, rows) {
                if (rows && rows.length) {
                    res.status(200).send(rows[0]);
                } else {
                    res.status(200).send({count: "0"});
                }
            });
    };

    this.getUserSignature = function (req, res, next) {
        var userId = req.params.id;
        var criteria = {
            user_id: userId
        };

        SecretKeyModel
            .find(criteria)
            .exec(function (err, secret) {
                var signImage;

                if (err) {
                    return next(err);
                }

                if (secret && secret.id) {
                    signImage = secret.attributes.sign_image;
                } else {
                    signImage = null;
                }
                res.status(200).send({signImage: signImage});
            });


    };

    this.renderError = function (err, req, res, next) {
        res.render('errorTemplate', {error: err});
    };

    this.helpMe = function (req, res, next) {
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
            email: email,
            subject: subject,
            text: text
        };

        UserModel
            .find(criteria, fetchOptions)
            .exec(function (err, userModel) {
                if (err) {
                    return next(err);
                }

                var saveData;
                var profile = userModel.related('profile');
                var company = userModel.related('company');

                mailerOptions.name = profile.get('first_name') + ' ' + profile.get('last_name');

                if (company && company.models.length && company.models[0].id) {
                    mailerOptions.company = company.models[0].get('name');
                }

                saveData = {
                    owner_id: userId,
                    email: email,
                    subject: subject,
                    body: text
                };

                MessageModel
                    .upsert(saveData, function (err, updatedModel) {
                        if (err) {
                            return next(err);
                        }
                    });

                mailer.helpMeMessage(mailerOptions);
                res.status(200).send({success: 'success'});
            })
    }
};

module.exports = UsersHandler;