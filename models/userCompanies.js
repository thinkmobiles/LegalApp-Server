'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var UserCompanyModel = ParentModel.extend({
        tableName: TABLES.USER_COMPANIES,
        //hidden: ['created_at', 'updated_at'],
        
        //profile: function () {
        //    return this.hasOne(PostGre.Models.Profile);
        //}
    });
    
    return UserCompanyModel;
};