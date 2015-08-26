'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var LinkedTemplatesModel = ParentModel.extend({
        tableName: TABLES.LINKED_TEMPLATES,
        hidden: ['created_at', 'updated_at']

    });

    return LinkedTemplatesModel;
};