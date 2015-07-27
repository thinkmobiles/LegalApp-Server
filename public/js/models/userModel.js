/**
 * Created by andrey on 19.07.15.
 */

define([], function () {
    var UserModel = Backbone.Model.extend({

        url: function () {
            var id_;
            if (this.get('id')) {
                id_ = this.get('id');

                return "/users/" + id_;
            }
                return "/users";
        },

        initialize: function () {
            this.on('invalid', function (model, errors) {
                if (errors.length > 0) {
                    var msg = errors.join('\n');
                    alert(msg);
                }
            });
        }
    });
    return UserModel;
});
