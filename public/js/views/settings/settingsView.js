/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/settings/settingsTemplate.html'
], function (SettingsTemplate) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(SettingsTemplate));
            return this;
        }

    });

    return View;

});