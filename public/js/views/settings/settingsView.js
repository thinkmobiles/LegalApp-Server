/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/settings/settingsTemplate.html',
    'collections/templatesCollection',
    'views/settings/templatesListView',
    'views/templates/templatesView'
], function (SettingsTemplate , TempCollection , TempListView, TemplatesView) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();

            this.tempCollection = new TempCollection();

            this.listenTo(this.tempCollection, 'reset', this.renderTableList);
        },

        events : {
            "click #goToAdd"       : "goToAddTemplate"
            //"click #openTemplates" : "goToTemplates"
        },

        goToAddTemplate : function(){
            Backbone.history.navigate('settings/addTemplate',{trigger : true});
        },

        //goToTemplates : function (){
        //    new TemplatesView({coll: this.tempCollection});
        //},

        renderTableList : function(){

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            this.tableView = new TempListView({coll: this.tempCollection});
        },

        render: function () {
            this.$el.html(_.template(SettingsTemplate));
            return this;
        }

    });

    return View;

});