/**
 * Created by root on 07.09.15.
 */

define([], function () {
    var CompanyModel = Backbone.Model.extend({

        url: function () {
            var id_;
            if (this.get('id')) {
                id_ = this.get('id');

                return "/companies/" + id_;
            }
            return "/companies";
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

    return CompanyModel;
});