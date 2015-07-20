'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var ProfileModel = ParentModel.extend({
        tableName: TABLES.PROFILES,
        hidden: ['id', 'user_id', 'created_at', 'updated_at']
        
    });
    
    return ProfileModel;
};