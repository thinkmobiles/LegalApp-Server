'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var DocumentModel = ParentModel.extend({
        tableName: TABLES.DOCUMENTS
        //hidden: ['created_at', 'updated_at'],

    });

    return DocumentModel;
};