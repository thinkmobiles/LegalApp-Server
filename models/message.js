'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var MessageModel = ParentModel.extend({
        tableName: TABLES.MESSAGES,

        owner: function() {
            return this.belongsTo(PostGre.Models.User, 'owner_id');
        }

    });

    return MessageModel;
};