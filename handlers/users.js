'use strict';

var CONSTANTS = require('../constants/index');
var MESSAGES = require('../constants/messages');
var EMAIL_REGEXP = CONSTANTS.EMAIL_REGEXP;

var async = require('async');
var crypto = require('crypto');
var badRequests = require('../helpers/badRequests');
var ProfilesHandler = require('../helpers/randomPass');
var tokenGenerator = require('../helpers/randomPass');

var ProfilesHandler = require('../handlers/profiles');

var UsersHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var profilesHandler = new ProfilesHandler(PostGre);
    
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
        
        confirmToken = tokenGenerator.generate();
        userData = {
            email: email,
            password: getEncryptedPass(password),
            confirm_token: confirmToken
        };

        async.waterfall([
            
            //check unique email:
            function (cb) {
                cb(); //TODO: ...
            },

            //save the user:
            function (cb) {
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
            
            if (err) {
                return next(err);
            }
            
            res.status(201).send({success: 'success signUp', user: userModel});
        });

    };

    this.signIn = function (req, res, next) {
        var options = req.body;
        var email = options.email;
        var password = options.password;
        var criteria;

        if (!email || !password) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'password']));
        }

        criteria = {
            email: email,
            password: getEncryptedPass(passoword)
        };

        UserModel
            .forge(criteria)
            .fetch()
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

                res.status(200).send({success: 'success signIn', user: userModel});
            });
    
    };
};

module.exports = UsersHandler;