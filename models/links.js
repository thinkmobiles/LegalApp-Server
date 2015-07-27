/**
 * Created by kille on 24.07.2015.
 */

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var LinksModel = ParentModel.extend({
        tableName: TABLES.LINKS,

        owner: function () {
            return this.belongsTo(PostGre.Models.Company);
        }
    });

    return LinksModel;
};