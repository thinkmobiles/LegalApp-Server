/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/settings/settingsTemplate.html',
    'collections/templatesCollection',
    'views/settings/templatesListView'
], function (SettingsTemplate , TempCollection , TempListView) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();

            this.tempCollection = new TempCollection();

            this.listenTo(this.tempCollection, 'reset', this.renderTableList);
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

        renderTableList : function(){

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            if (this.tempCollection.length) {
                this.tableView = new TempListView({coll: this.tempCollection});
            }
        },

        render: function () {
            this.$el.html(_.template(SettingsTemplate));
            return this;
        }

    });

    return View;

});