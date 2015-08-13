'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var DocumentModel = ParentModel.extend({
        tableName: TABLES.DOCUMENTS,
        hidden: ['html_content', 'created_at', 'updated_at'],

        template: function () {
            return this.belongsTo(PostGre.Models.Template);
        }
    });

    return DocumentModel;
};