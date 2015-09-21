'use strict';

var MESSAGES = require('../constants/messages');
var MESSAGE_TYPES = require('../constants/messageTypes');

var async = require('async');

var badRequests = require('../helpers/badRequests');
var mailer = require('../helpers/mailer');

var MessageHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var MessageModel = Models.Message;
    var self = this;

    this.helpMe = function (req, res, next) {
        var userId = req.session.userId;
        var options = req.body;
        var email = options.email;
        var subject = options.subject;
        var text = options.emailText;
        var mailerOptions;
        var fetchOptions;
        var criteria = {
            id: userId
        };

        if (!email || !text || !subject) {
            return next(badRequests.NotEnParams({reqParams: ['subject', 'emailText', 'email']}));
        }

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
            });
    };

    this.getMessagesCurrentUser = function (req, res, next) {
        var userId = req.session.userId;
        var fetchOptions = {
            withRelated: ['owner.profile', 'owner.avatar']
        };
        var path = req.path.toLowerCase();

        MessageModel
            .forge()
            .query(function (qb) {

                qb.where('owner_id', userId);

                if (path === '/helpme') {
                    qb.andWhere('type', MESSAGE_TYPES.HELP_ME);
                } else if (path === '/contactus') {
                    qb.andWhere('type', MESSAGE_TYPES.CONTACT_US);
                } else {
                    //nothing else
                }

                qb.orderBy('created_at', 'DESC');
            })
            .fetchAll(fetchOptions)
            .exec(function (err, collection) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(collection);
            });
    };

    this.getMessagesAdmins = function (req, res, next) {
        var query = req.query;
        var type = query.type;
        var fetchOptions = {
            withRelated: ['owner.profile', 'owner.avatar']
        };

        MessageModel
            .forge()
            .query(function (qb) {
                if (type === 'helpMe') {
                    qb.where('type', MESSAGE_TYPES.HELP_ME);
                } else if (type === 'contactUs') {
                    qb.where('type', MESSAGE_TYPES.CONTACT_US);
                } else {
                    //nothing else
                }

                qb.orderBy('created_at', 'DESC');
            })
            .fetchAll(fetchOptions)
            .exec(function (err, collection) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(collection);
            });

    };

    this.changeIsCompleted = function (req, res, next) {
        var messageId = req.params.id;
        var options = req.body;
        var isCompleted = options.is_completed;
        var criteria = {
            id: messageId
        };
        var saveData = {
            is_completed: isCompleted
        };

        if (isCompleted === undefined) {
            return next(badRequests.NotEnParams({reqParams: 'is_completed'}));
        }

        if (typeof isCompleted !== 'boolean') {
            return next(badRequests.InvalidValue({param: 'is_completed', value: isCompleted}));
        }

        MessageModel
            .forge(criteria)
            .save(saveData, {patch: true})
            .then(function (updatedModel) {
                res.send({success: 'updated'});
            })
            .catch(MessageModel.NotFoundError, function (err) {
                next(badRequests.NotFound({message: 'Message was not found'}));
            })
            .catch(function(err) {
                if (err.message && (err.message.indexOf('No rows were affected in the update') !== -1)) {
                    return next(badRequests.NotFound({message: 'Message was not found'}));
                }
                next(err);
            });


    }
};

module.exports = MessageHandler;