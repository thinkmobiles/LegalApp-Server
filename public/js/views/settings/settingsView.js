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
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_setting').addClass('active')
        }

    });

    return View;

});