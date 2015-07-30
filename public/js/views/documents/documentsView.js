/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsListTemplate.html'
], function (ListTemplate) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(ListTemplate));
            return this;
        }

    });

    return View;

});