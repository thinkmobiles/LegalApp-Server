var CONSTANTS = require('../constants/index');
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


        if (options && options.rememberMe === 'true') {
            req.session.rememberMe = true;
            req.session.cookie.maxAge = 1000 * 3600 * 24 * 365 * 5; //5 year
        } else {
            req.session.rememberMe = false;
            req.session.cookie.maxAge = CONSTANTS.SESSION_MAX_AGE;
        }

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
            if (!req.session.rememberMe) {
                req.session.cookie.expires = new Date(Date.now() + CONSTANTS.SESSION_MAX_AGE);
            }
            next();
        } else {
            return next(badRequests.UnAuthorized());
        }
    };

    this.authenticatedEditor = function (req, res, next) {
        var availablePermissions = [
            PERMISSIONS.SUPER_ADMIN,
            PERMISSIONS.ADMIN,
            PERMISSIONS.CLIENT_ADMIN,
            PERMISSIONS.EDITOR,
            PERMISSIONS.CLENT_EDITOR
        ];
        var permissions = req.session.permissions;

        if (req.session && req.session.userId && req.session.loggedIn) {
            //next();
        } else {
            return next(badRequests.UnAuthorized());
        }

        if (!req.session.rememberMe) {
            req.session.cookie.expires = new Date(Date.now() + CONSTANTS.SESSION_MAX_AGE);
        }

        if ((availablePermissions.indexOf(permissions) !== -1)) {
            next();
        } else {
            next(badRequests.AccessError());
        }
    };

    this.authenticatedAdminsEditors = function (req, res, next) {
        var availablePermissions = [
            PERMISSIONS.SUPER_ADMIN,
            PERMISSIONS.ADMIN,
            PERMISSIONS.EDITOR
        ];
        var permissions = req.session.permissions;

        if (req.session && req.session.userId && req.session.loggedIn && (availablePermissions.indexOf(permissions) !== -1)) {
            if (!req.session.rememberMe) {
                req.session.cookie.expires = new Date(Date.now() + CONSTANTS.SESSION_MAX_AGE);
            }
            next();
        } else {
            next(badRequests.AccessError());
        }
    };

    this.isAuthenticatedUser = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn) {
            res.status(200).send({success: true, exp: req.session.cookie.expires});
        } else {
            var err = new Error('Unauthorized');
            err.status = 401;
            next(err);
        }
    };

    this.authenticatedAdmin = function (req, res, next) {
        if (req.session && req.session.userId && req.session.loggedIn && ((req.session.permissions === PERMISSIONS.SUPER_ADMIN) || (req.session.permissions === PERMISSIONS.ADMIN))) {
            if (!req.session.rememberMe) {
                req.session.cookie.expires = new Date(Date.now() + CONSTANTS.SESSION_MAX_AGE);
            }
            next();
        } else {
            next(badRequests.AccessError());
        }
    };

    this.isAdmin = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn && ((req.session.permissions === PERMISSIONS.SUPER_ADMIN) || (req.session.permissions === PERMISSIONS.ADMIN))) {
            return true;
        } else {
            return false;
        }
    };

    this.isClientAdmin = function (req) {
        if (req.session && req.session.userId && req.session.loggedIn && req.session.permissions === PERMISSIONS.CLIENT_ADMIN) {
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