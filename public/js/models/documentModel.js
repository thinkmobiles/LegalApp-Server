/**
 * Created by root on 13.08.15.
 */

define([], function () {
    var DocumentModel = Backbone.Model.extend({

        url: function () {
            var id_;
            if (this.get('id')) {
                id_ = this.get('id');

                return "/documents/" + id_;
            }
            return "/documents";
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

    return DocumentModel;
});