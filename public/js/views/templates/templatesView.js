/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/templates/templatesTemplate.html',
    'text!templates/templates/templatesGrid.html',
    'text!templates/templates/templatesList.html',
    'views/templates/addTemplate/addTemplateView',
    'collections/templatesCollection'

], function (TempTemplate, TempGridItem, TempListItem, AddTemplate, TempCollection) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        templateGridItem : _.template(TempGridItem),
        templateListItem : _.template(TempListItem),

        initialize: function (options) {
            this.render();

            this.tempCollection = new TempCollection();
            this.stateModel = new Backbone.Model();
            this.stateModel.set('viewType', options.viewType);

            this.listenTo(this.tempCollection, 'reset', this.renderAlltemplates);
            this.listenTo(this.stateModel, 'change:viewType', this.renderAlltemplates);
        },

        events : {
            "click #addDiv"     : "goToAddTemplate",
            "click .tempGrid"   : "goToPreview"
        },

        goToAddTemplate : function(){
            var currentView =  new AddTemplate({parentCont : this});
            currentView.on('addInParentView', this.addOneGrid, this);
            this.$el.find('#addTemplateContainer').html(currentView.el);
        },

        goToPreview: function(event){
            var target_id = $(event.target).closest('.tempGrid').data('id');
            var url = '#templates/preview/'+target_id;
            if (target_id){
                Backbone.history.navigate(url, {trigger: true});
            }
        },

        renderAlltemplates : function(){
            var self = this;
            var innerContext='';
            var currentCollection = this.tempCollection.toJSON();
            var viewTp = this.stateModel.get('viewType');

            if (viewTp === 'grid') {
                currentCollection.forEach(function (template) {
                    innerContext = self.templateGridItem(template) + innerContext;
                });
            }

            if (viewTp === 'list') {
                currentCollection.forEach(function (template) {
                    innerContext = self.templateListItem(template) + innerContext;
                });
            }


            this.$el.append(innerContext);
        },

        addOneGrid: function(model){
            this.$el.append(this.templateGridItem(model));
        },

        render: function () {

            this.$el.html(TempTemplate);
            return this;
        }

    });

    return View;

});
