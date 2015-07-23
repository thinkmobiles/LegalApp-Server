/**
 * Created by andrey on 19.07.15.
 */

define(['validation'], function (validation) {
    var UserModel = Backbone.Model.extend({
        //idAttribute: "_id",

        initialize: function () {
            this.on('invalid', function (model, errors) {
                if (errors.length > 0) {
                    var msg = errors.join('\n');
                    alert(msg);
                }
            });
        },

        //validate: function (attrs) {
        //    var errors = [];
        //
        //    if (errors.length > 0)
        //        return errors;
        //},

        defaults: {

        }
    });
    return UserModel;
});
