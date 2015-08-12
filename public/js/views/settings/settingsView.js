/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/settings/settingsTemplate.html'

], function (SettingsTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.render();
        },

        events : {

        },

        render: function () {
            this.$el.html(_.template(SettingsTemp));
            return this;
        }

    });

    return View;

});