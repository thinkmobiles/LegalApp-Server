/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/templates/templatesTemplate.html'
], function (TempTemplate) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(TempTemplate));
            return this;
        }

    });

    return View;

});