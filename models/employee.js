'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var EmployeeModel = ParentModel.extend({
        tableName: TABLES.EMPLOYEES,
        company: function () {
            return this.belongsTo(PostGre.Models.Company);
        }
    });

    return EmployeeModel;
};