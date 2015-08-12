/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/templates/templatesListTemplate.html',
    'collections/templatesCollection',
    'views/templates/templatesList'

], function (TempTemplate , TempCollection , TempList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

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
            Backbone.history.navigate('addTemplate',{trigger : true});
        },

        renderTableList : function(){

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            this.tableView = new TempList({coll: this.tempCollection});
        },

        render: function () {
            this.$el.html(_.template(TempTemplate));
            return this;
        }

    });

    return View;

});