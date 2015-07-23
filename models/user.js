'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var UserModel = ParentModel.extend({
        tableName: TABLES.USERS,
        hidden: ['password', 'confirm_token', 'forgot_token'],

        profile: function () {
            return this.hasOne(PostGre.Models.Profile);
        },

        company: function () { 
            return this.hasOne(PostGre.Models.Company, 'owner_id');
        },

        userCompany: function () {
        
        }
    });

    return UserModel;
};