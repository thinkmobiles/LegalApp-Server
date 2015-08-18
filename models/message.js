/**
 * Created by root on 17.08.15.
 */

'use strict';

var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var MessageModel = ParentModel.extend({
        tableName: TABLES.MESSAGES,
        hidden: ['id', 'owner_id']

    });

    return MessageModel;
};