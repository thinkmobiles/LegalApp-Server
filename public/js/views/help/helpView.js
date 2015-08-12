/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/help/helpTemplate.html'

], function (HelpTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.render();
        },

        events : {

        },

        render: function () {
            this.$el.html(_.template(HelpTemp));
            return this;
        }

    });

    return View;

});