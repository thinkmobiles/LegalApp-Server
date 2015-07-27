'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');

var ProfileHandler = function (PostGre) {
    var Models = PostGre.Models;
    var UserModel = Models.User;
    var ProfileModel = Models.Profile;
    var self = this;
    
    this.prepareSaveData = function (params) {
        var saveData = {};

        if (params && params.first_name) {
            saveData.first_name = params.first_name;
        }
        if (params && params.last_name) {
            saveData.last_name = params.last_name;
        }
        if (params && params.phone) {
            saveData.phone = params.phone;
        }
        //if (params && params.company) {
        //    saveData.company = params.company;
        //}
        
        return saveData;
    };
    
    this.removeProfile = function (userId, callback) {
        //TODO: ...
    };
    
};

module.exports = ProfileHandler;