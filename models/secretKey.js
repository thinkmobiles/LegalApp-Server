'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var SecretKeyModel = ParentModel.extend({
        tableName: TABLES.USERS_SECRET_KEY,
        hidden: ['id', 'user_id','secret_key', 'created_at', 'updated_at'],

        owner: function () {
            return this.belongsTo(PostGre.Models.User);
        }
    });

    return SecretKeyModel;
};
