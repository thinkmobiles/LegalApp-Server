'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;
var PERMISSOINS = require('../constants/permissions');

var async = require('async');
var crypto = require('crypto');

var badRequests = require('../helpers/badRequests');
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');

var SessionHandler = require('../handlers/sessions');
var ProfilesHandler = require('../handlers/profiles');
var CompaniesHandler = require('../handlers/companies');

var UsersHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var session = new SessionHandler(PostGre);
    var profilesHandler = new ProfilesHandler(PostGre);
    var companiesHandler = new CompaniesHandler(PostGre);
    var self = this;

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };
    
    function saveUser(data, callback) {
        if (data && data.id) {
            return UserModel.forge({ id: data.id }).save(data, { patch: true }).exec(callback);
        } else {
            return UserModel.forge().save(data).exec(callback);
        }
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
        var firstName = options.first_name;
        var lastName = options.last_name;
        var phone = options.phone;
        var company = options.company;
        var profileData = {};
        
        async.waterfall([

            //check incoming params and prepare the saveData:
            function (cb) {
                
                if (firstName) {
                    profileData.first_name = firstName;
                }
                if (lastName) {
                    profileData.last_name = lastName;
                }
                if (phone !== undefined) {
                    profileData.phone = phone;
                }
                if (company !== undefined) {
                    profileData.company = company;
                }
                
                if (Object.keys(profileData).length === 0) {
                    return cb(badRequests.NotEnParams({ message: 'There are no params for update' }));
                }
                
                cb();
            },

            //find the user:
            function (cb) {
                var criteria = {
                    id: userId
                };
                var fetchOptions = {
                    required: true,
                    withRelated: ['profile']
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
                    .save(profileData, { patch: true })
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
            return next(badRequests.NotEnParams({ reqParams: ['email', 'password', 'company'] }));
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

                saveUser(userData, function (err, userModel) {
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
                profileData.permissions = PERMISSOINS.OWNER;
                profilesHandler.saveProfile(profileData, function (err, profileModel) {
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
            }
            mailer.onSendConfirm(mailerOptions);

            res.status(201).send({ success: MESSAGES.SUCCESS_REGISTRATION_MESSAGE });
        });

    };

    this.signIn = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var password = options.password;
        var criteria;

        if (!email || !password) {
            return next(badRequests.NotEnParams({ reqParams: ['email', 'password'] }));
        }

        criteria = {
            email: email,
            password: getEncryptedPass(password)
        };

        UserModel
            .forge(criteria)
            .fetch({
                withRelated: ['profile']
            })
            .exec(function (err, userModel) {
                var profile;
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
                sessionOptions = {
                    permissions: profile.get('permissions')
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
                    .save(saveData, { patch: true })
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

        UserModel
            .forge(criteria)
            .fetch({
                require: true,
                withRelated: ['profile', 'company']
            })
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
        
        updateUserById(userId, options, function (err, userModel) {
            if (err) {
                return next(err);
            }
            res.status(200).send({ success: 'success updated', user: userModel });
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
                        .save(saveData, {patch : true})
                        .then(function (user){
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
            .fetch({require : true})
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
            .catch(UserModel.NotFoundError,function(err){
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.inviteUser = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var company = options.company;
        var userData;
        var userPassword;

        //validate options:
        if (!email) {
            return next(badRequests.NotEnParams({ reqParams: ['email'] }));
        }

        //email validation:
        if (!EMAIL_REGEXP.test(email)) {
            return next(badRequests.InvalidEmail());
        }

        //if (!session.isSuperAdmin(req)){
        //    return next(badRequests.AccessError())
        //}

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

                saveUser(userData, function (err, userModel) {
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
                profileData.permissions = options.permissions;
                profilesHandler.saveProfile(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    userModel.set('profile', profileModel);
                    cb(null, userModel);
                });
            }

            //add current user to company
            //function (userModel, cb) {
            //
            //}

        ], function (err, userModel) {
            var mailerOptions;

            if (err) {
                return next(err);
            }

            mailerOptions = {
                email: email,
                userPassword: userPassword
            };
            mailer.onUserInvite(mailerOptions);

            res.status(201).send({ success: MESSAGES.SUCCESS_INVITE_MESSAGE });
        });

    };

    this.renderError = function (err, req, res, next) {
        res.render('errorTemplate', { error: err });
    };
};

module.exports = UsersHandler;