'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var TemplateModel = ParentModel.extend({
        tableName: TABLES.TEMPLATES,
        hidden: ['created_at', 'updated_at'],

        link: function () {
            return this.belongsTo(PostGre.Models.Link);
        },

        company: function () {
            return this.belongsTo(PostGre.Models.Company);
        }
    });

    return TemplateModel;
};