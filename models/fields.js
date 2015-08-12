'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var FieldModel = ParentModel.extend({
        tableName: TABLES.FIELDS
        //hidden: ['created_at', 'updated_at']
    });

    return FieldModel;
};