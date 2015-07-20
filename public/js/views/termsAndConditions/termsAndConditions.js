/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/termsAndConditions/termsAndConditionsTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(template));
            return this;
        }

    });

    return View;

});