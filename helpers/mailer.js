'use strict';

var _ = require('./../public/js/libs/underscore/underscore-min.js');
var nodemailer = require("nodemailer");
var fs = require("fs");
var FROM = "LegalApp <" + "info@legalapp.com" + ">";

var MailerModule = function () {

    function deliver(mailOptions, callback) {
        var user = process.env.mailerUserName;
        var pass = process.env.mailerPassword;
        var service = process.env.mailerService;

        var smtpTransport = nodemailer.createTransport({
            service: service,
            auth   : {
                user: user,
                pass: pass
            }
        });

        //console.error('mailer was blocked');

        smtpTransport.sendMail(mailOptions, function (err, responseResult) {
            if (err) {
                console.log(err);
                if (callback && typeof callback === 'function') {
                    callback(err, null);
                }
            } else {
                console.log('Message sent: %s %s', mailOptions.to, responseResult.response);
                if (callback && typeof callback === 'function') {
                    callback(null, responseResult);
                }
            }
        });
    }

    this.onForgotPassword = function (options, callback) {
        var templateOptions;
        var mailOptions;

        templateOptions = {
            url: process.env.HOST + '/#resetPassword/' + options.forgot_token
        };

        mailOptions = {
            from                : FROM,
            to                  : options.email,
            subject             : 'Forgot password',
            generateTextFromHTML: true,
            html                : _.template(fs.readFileSync('public/templates/mailer/forgotPassword.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions, callback);

    };

    this.onUserInvite = function (options, callback) {
        var templateOptions;
        var mailOptions;

        templateOptions = {
            url: process.env.HOST + '/#login/token/' + options.resetToken
        };

        mailOptions = {
            from                : FROM,
            to                  : options.email,
            subject             : 'Invite to Legal-App',
            generateTextFromHTML: true,
            html                : _.template(fs.readFileSync('public/templates/mailer/inviteUser.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions, callback);

    };

    this.helpMeMessage = function (options, callback) {
        var templateOptions;
        var mailOptions;

        templateOptions = {
            email    : options.email,
            emailText: options.text,
            name     : options.name,
            company  : options.company
        };

        mailOptions = {
            from                : FROM,
            to                  : options.email,// todo -mcCooper mail-
            subject             : options.subject,
            generateTextFromHTML: true,
            html                : _.template(fs.readFileSync('public/templates/mailer/helpMe.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions, callback);

    };

    this.onSendToSignature = function (options, callback) {
        var templateOptions;
        var mailOptions;
        var document = options.document;
        var dstUser = options.dstUser;
        var srcUser = options.srcUser;
        var company = options.company;
        var template = options.template;
        var status = document.status;
        var link;

        if (status === 2) {
            link = process.env.HOST + '/#signature/company/' + document.access_token;
        } else if (status === 3) {
            link = process.env.HOST + '/#signature/user/' + document.access_token;
        } else {
            return console.error('Invalid status of document');
        }

        templateOptions = {
            email        : dstUser.email,
            srcUserName  : srcUser.profile.last_name,
            dstUserName  : (dstUser.profile) ? dstUser.profile.last_name : dstUser.last_name, //user or employee
            companyName  : company.name,
            documentName : document.name || template.name, //TODO
            signatureLink: link
        };

        mailOptions = {
            from                : FROM,
            to                  : dstUser.email,
            subject             : document.name || template.name, //TODO
            generateTextFromHTML: true,
            html                : _.template(fs.readFileSync('public/templates/mailer/sendToSignature.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions, callback);
    };

    this.onSignUp = function (options, callback) {
        var mailOptions;

        mailOptions = {
            from   : FROM,
            to     : options.email,
            subject: "We get your requst",
            html   : _.template(fs.readFileSync('public/templates/mailer/sendSignUpAccept.html', "utf8"))()
        };

        deliver(mailOptions, callback);
    };

    this.onAcceptUser = function (options, callback) {
        var mailOptions;
        var templateOptions;

        templateOptions = {
            url: process.env.HOST + '/#login/' + options.forgot_token
        };

        mailOptions = {
            from   : FROM,
            to     : options.email,
            subject: "Your request was accepted",
            html   : _.template(fs.readFileSync('public/templates/mailer/sendAcceptUser.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions, callback);
    };

    this.onRejectUser = function (options, callback) {
        var mailOptions;

        mailOptions = {
            from   : FROM,
            to     : options.email,
            subject: "Your request was rejected",
            html   : _.template(fs.readFileSync('public/templates/mailer/sendRejectUser.html', "utf8"))()
        };

        deliver(mailOptions, callback);
    };

};

module.exports = new MailerModule();
