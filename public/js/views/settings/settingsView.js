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

        events : {
            "click #goToAdd"   : "goToAddTemplate",
            "click .tabs a"    : "changeTabs"
        },

        goToAddTemplate : function(){
            Backbone.history.navigate('settings/addTemplate',{trigger : true});
        },

        changeTabs : function(event){
            var target = $(event.target);
            var container = $('.tabs');
            var container2 = $('.tabs-items');
            var n;

            container.find('.active').removeClass('active');
            target.addClass('active');

            n = container.find('li').index(target.parent());

            container2.find('.openTab').removeClass('openTab');
            container2.find('.tabs-item').eq(n).addClass('openTab');

        },

        render: function () {
            this.$el.html(_.template(SettingsTemplate));
            return this;
        }

    });

    return View;

});