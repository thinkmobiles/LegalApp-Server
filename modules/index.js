module.exports = function ( app ) {

    var modules = {};

    modules._ = require( './../public/js/libs/underscore-min.js');
    modules.logWritter = require( './logWriter' )( app );
    modules.tokenGenerator = require( './randomPass' );
    modules.badRequests = require( './badRequests' )( app );
    modules.mailer = require( './mailer' )( app, modules );

    return modules;
};
