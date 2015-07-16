var USER_ROLES = require('../constants/userRoles');
var SESSION_SUPER_ADMIN = 'superAdmin';
var SESSION_USER = 'user';

var Session = function (postGre) {
    "use strict";

    this.register = function (req, res, userModel, options) {
        var status = (options && options.status) ? options.status : 200;
        var firstLogin = (options && options.firstLogin) ? options.firstLogin : false;
        var role;

        if (userModel.get('role') === USER_ROLES.SUPER_ADMIN) {
            role = SESSION_SUPER_ADMIN;
            req.session.lastLogin = new Date();
        } else {
            role = SESSION_USER;
        }

        req.session.loggedIn = true;
        req.session.userId = userModel.id;
        req.session.userRole = role;

        if (process.env.NODE_ENV === 'test') {
            res.status(status).send({
                success: "Login successful",
                user: userModel
            });
        } else {
            res.status(status).send({success: "Login successful", userId: userModel.id, firstLogin: firstLogin});
        }

    };

    this.kill = function (req, res, next) {
        var userId;
        var options = req.body;

        if (req.session && req.session.userId) {
            req.session.destroy();
        }

        res.status(200).send({success: "Logout successful"});

    };

    this.authenticatedUser = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn) {
            next();
        } else {
            var err = new Error('Unauthorized');
            err.status = 401;
            next(err);
        }
    };

    this.isAuthenticatedUser = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn) {
            res.status(200).send();
        } else {
            var err = new Error('Unauthorized');
            err.status = 401;
            next(err);
        }
    };

    this.authenticatedSuperAdmin = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.userRole === SESSION_SUPER_ADMIN) {
            next();
        } else {
            var err = new Error('Forbidden');
            err.status = 403;
            next(err);
        }
    };

    this.isAuthenticatedSuperAdmin = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.userRole === SESSION_SUPER_ADMIN) {
            res.status(200).send();
        } else {
            var err = new Error('Forbidden');
            err.status = 403;
            next(err);
        }
    };

    this.isSuperAdmin = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.userRole === SESSION_SUPER_ADMIN) {
            return true;
        } else {
            return false;
        }
    };

    this.isAnonyme = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn) {
            return false;
        } else {
            return true;
        }
    };

    this.getPrivacyParams = function (req) {
        var result = {};

        if (req.session && req.session.userId) {
            result.userId = req.session.userId;

            if (req.session.userRole === SESSION_SUPER_ADMIN) {
                result.isSuperAdmin = true;
            }

        } else {
            result.isAnonyme = true;
        }

        return result;
    };

};

module.exports = Session;