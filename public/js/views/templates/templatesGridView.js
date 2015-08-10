/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/templates/templatesGridTemplate.html',
    'text!templates/templates/templatesGrid.html',
    'views/templates/addTemplate/addTemplateView',
    'collections/templatesCollection'

], function (TempTemplate, TempItem, AddTemplate, TempCollection) {

    var View;
    View = Backbone.View.extend({

        templateItem : _.template(TempItem),

        initialize: function () {
            this.render();

            this.tempCollection = new TempCollection();

            this.listenTo(this.tempCollection, 'reset', this.renderAllGrids);
        },

        events : {
            "click #addDiv"     : "goToAddTemplate"
        },

        goToAddTemplate : function(){
            var currentView =  new AddTemplate();
            this.$el.find('#addTemplateContainer').html(currentView.el);
        },

        renderAllGrids : function(){
            var self = this;
            var innerContext='';
            var currentCollection  = this.tempCollection.toJSON();

            currentCollection.forEach(function(template){
                innerContext += self.templateItem(template);
            });

            this.$el.append(innerContext);
        },

        render: function () {

            this.$el.html(TempTemplate);
            return this;
        }

    });

    return View;

});