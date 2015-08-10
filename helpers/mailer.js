'use strict';

var _ = require('./../public/js/libs/underscore/underscore-min.js');
var nodemailer = require("nodemailer");
var fs = require("fs");
var FROM = "LegalApp <" + "info@legalapp.com" + ">";

var MailerModule = function () {
    
    this.onSendConfirm = function (options, callback) {
        var templateOptions;
        var mailOptions;
        
        templateOptions = {
            email: options.email,
            url: process.env.HOST + '/#confirmEmail/' + options.confirmToken
        };
        console.log('templateOptions', templateOptions);
        mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Confirm Email",
            html: _.template(fs.readFileSync('public/templates/mailer/sendEmailConfirm.html', "utf8"))(templateOptions)
        };
        
        deliver(mailOptions, callback);
    }
    
    function onSendRessetPassword(options, callback) {
        var templateOptions = {
            email: options.email,
            password: options.password,
            host: process.env.HOST
        };
        var mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Resset password",
            html: _.template(fs.readFileSync('public/templates/mailer/sendResetPassword.html', "utf8"), templateOptions)
        };
        
        deliver(mailOptions, callback);
    }
    
    function onChangeEmail(options, callback) {
        var templateOptions = {
            email: options.email,
            change_email: options.change_email,
            token: options.confirm_token,
            host: process.env.HOST
        };
        var mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Change Email",
            html: _.template(fs.readFileSync('public/templates/mailer/changeEmail.html', "utf8"), templateOptions)
        };
        
        console.log(templateOptions);
        
        deliver(mailOptions, callback);
    }
    
    function onConfirmChangeEmail(options, callback) {
        var templateOptions;
        var mailOptions;
        
        templateOptions = {
            email: options.email,
            url: process.env.HOST + 'changeEmail/confirm/' + options.confirmToken
        };
        
        mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Confirm Email",
            html: _.template(fs.readFileSync('public/templates/mailer/confirmChangeEmail.html', "utf8"), templateOptions)
        };
        
        deliver(mailOptions, callback);
    }
    
    function deliver(mailOptions, callback) {
        var user = process.env.mailerUserName;
        var pass = process.env.mailerPassword;
        var service = process.env.mailerService;
        
        var smtpTransport = nodemailer.createTransport({
            service: service,
            auth: {
                user: user,
                pass: pass
            }
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.log(service, user, pass);
        }
        
        smtpTransport.sendMail(mailOptions, function (err, responseResult) {
            if (err) {
                console.log(err);
                if (callback && typeof callback === 'function') {
                    callback(err, null);
                }
            } else {
                console.log('Message sent: ' + responseResult.response);
                if (callback && typeof callback === 'function') {
                    callback(null, responseResult);
                }
            }
        });
    }

    this.onForgotPassword = function(options, callback) {
            var templateOptions;
            var mailOptions;

            templateOptions = {
                url: process.env.HOST + '/#resetPassword/' + options.forgot_token
            };

            mailOptions = {
                from: FROM,
                to: options.email,
                subject: 'Forgot password',
                generateTextFromHTML: true,
                html: _.template(fs.readFileSync('public/templates/mailer/forgotPassword.html', "utf8"))(templateOptions)
            };

            deliver(mailOptions,callback);

    }

    this.onUserInvite = function(options, callback) {
        var templateOptions;
        var mailOptions;

        templateOptions = {
            url: process.env.HOST + '/#login/'+options.resetToken
        };

        mailOptions = {
            from: FROM,
            to: options.email,
            subject: 'Invite to Legal-App',
            generateTextFromHTML: true,
            html: _.template(fs.readFileSync('public/templates/mailer/inviteUser.html', "utf8"))(templateOptions)
        };

        deliver(mailOptions,callback);

    }
   
};

module.exports = new MailerModule();
