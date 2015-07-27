/**
 * Created by kille on 24.07.2015.
 */

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var LinksFieldsModel = ParentModel.extend({
        tableName: TABLES.LINKS_FIELDS,

        owner: function () {
            return this.belongsTo(PostGre.Models.Links);
        }
    });

    return LinksFieldsModel;
};