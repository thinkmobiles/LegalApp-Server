/**
 * Created by root on 28.07.15.
 */

define([], function () {
    var TemplateModel = Backbone.Model.extend({

        url: function () {
            var id_;
            if (this.get('id')) {
                id_ = this.get('id');

                return "/templates/" + id_;
            }
            return "/templates";
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
    return TemplateModel;
});