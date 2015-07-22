'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var CompanyModel = ParentModel.extend({
        tableName: TABLES.COMPANIES,
        //hidden: ['created_at', 'updated_at'],
        
        owner: function () {
            return this.belongsTo(PostGre.Models.User);
        }
    });
    
    return CompanyModel;
};