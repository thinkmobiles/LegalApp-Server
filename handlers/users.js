'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;

var async = require('async');
var crypto = require('crypto');

var badRequests = require('../helpers/badRequests');
var ProfilesHandler = require('../helpers/randomPass');
var tokenGenerator = require('../helpers/randomPass');
var mailer = require('../helpers/mailer');

var SessionHandler = require('../handlers/sessions');
var ProfilesHandler = require('../handlers/profiles');

var UsersHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var session = new SessionHandler(PostGre);
    var profilesHandler = new ProfilesHandler(PostGre);
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
    
    function validateUser(data, callback) {
        
    }

    this.signUp = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var password = options.password;
        var confirmToken;
        var userData;
        
        //validate options:
        if (!email || !password) {
            return next(badRequests.NotEnParams({ reqParams: ['email', 'password', 'first_name', 'last_name'] }));
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
                }

                UserModel
                    .forge(criteria)
                    .fetch()
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
                profilesHandler.saveProfile(profileData, function (err, profileModel) {
                    if (err) {
                        removeUser(userModel);
                        return cb(err);
                    }
                    userModel.set('profile', profileModel);
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
                if (err) {
                    return next(err);
                }
                if (!userModel || !userModel.id) { 
                    return next(badRequests.SignInError());
                }

                if (userModel && userModel.get('confirm_token')) {
                    return next(badRequests.UnconfirmedEmail());
                }

                session.register(req, res, userModel);
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
                withRelated: 'profile'
            })
            .then(function (userModel) {
                res.status(200).send(userModel);
            })
            .catch(UserModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.renderError = function (err, req, res, next) {
        res.render('errorTemplate', { error: err });
    };
};

module.exports = UsersHandler;