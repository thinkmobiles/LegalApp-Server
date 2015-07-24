var MESSAGES = require('../constants/messages');
var USER_ROLES = require('../constants/userRoles');
var SESSION_SUPER_ADMIN = 'superAdmin';
var SESSION_USER = 'user';
var PERMISSIONS = require('../constants/permissions');

var badRequests = require('../helpers/badRequests');

var Session = function (postGre) {
    "use strict";

    this.register = function (req, res, userModel, options) {
        var status = (options && options.status) ? options.status : 200;

        if (options && (options.permissions !== undefined)) {
            req.session.permissions = options.permissions;
        }

        if (options && (options.companyId !== undefined)) {
            req.session.companyId = options.companyId;
        }

        req.session.loggedIn = true;
        req.session.userId = userModel.id;
        
        res.status(status).send({ success: MESSAGES.SUCCESS_SIGN_IN, user: userModel });
    };

    this.kill = function (req, res, next) {
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

    /*this.authenticatedSuperAdmin = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.userRole === SESSION_SUPER_ADMIN) {
            next();
        } else {
            var err = new Error('Forbidden');
            err.status = 403;
            next(err);
        }
    };*/

    this.authenticatedAdmin = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn && ((req.session.permissions === PERMISSIONS.OWNER) || (req.session.permissions === PERMISSIONS.ADMIN))) {
            next();
        } else {
            next(badRequests.AccessError());
        }
    };

    this.isAdmin = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn && ((req.session.permissions === PERMISSIONS.OWNER) || (req.session.permissions === PERMISSIONS.ADMIN))) {
            return true;
        } else {
            return false;
        }
    };

    this.isEditor = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.permissions === PERMISSIONS.EDITOR) {
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