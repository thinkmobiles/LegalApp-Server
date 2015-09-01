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

        el : '#wrapper',

        templateItem : _.template(TempItem),

        initialize: function (options) {
            this.render();

            this.stateModel.set('viewType', options.viewType);
            this.tempCollection = new TempCollection();

            this.listenTo(this.tempCollection, 'reset', this.renderAlltemplates);
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
                    innerContext = self.templateItem(template) + innerContext;
                });
            }

            this.$el.append(innerContext);
        },

        addOneGrid: function(model){
            this.$el.append(this.templateItem(model));
        },

        render: function () {

            this.$el.html(TempTemplate);
            return this;
        }

    });

    return View;

});
