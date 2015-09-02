/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/templates/templatesTemplate.html',
    'text!templates/templates/templatesGridTemplate.html',
    'text!templates/templates/templatesListTemplate.html',
    'text!templates/templates/templatesGrid.html',
    'text!templates/templates/templatesList.html',
    'views/templates/addTemplate/addTemplateView',
    'collections/templatesCollection'

], function (
    TempTemplate,
    TempGrid,
    TempList,
    TempGridItem,
    TempListItem,
    AddTemplate,
    TempCollection) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        templateGridItem : _.template(TempGridItem),
        templateListItem : _.template(TempListItem),
        templateList : _.template(TempList),
        templateGrid : _.template(TempGrid),

        initialize: function (options) {
            this.render();

            this.tempCollection = new TempCollection();
            this.stateModel = new Backbone.Model();
            this.stateModel.set('viewType', options.viewType);

            this.listenTo(this.tempCollection, 'reset', this.renderAlltemplates);
            this.listenTo(this.stateModel, 'change:viewType', this.renderAlltemplates);
        },

        events : {
            "click #addDiv"      : "goToAddTemplate",
            "click .tempGrid"    : "goToPreview",
            "click .btnViewType" : "changeViewType"
        },

        changeViewType: function(event){
            var targetView = $(event.target).data('id');
            this.stateModel.set('viewType',targetView);
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
                //currentCollection.forEach(function (template) {
                //    innerContext = self.templateGridItem(template) + innerContext;
                //});
                this.$el.find('#allTemplatesCont').html(this.templateGrid({tempList : currentCollection}));
            }

            if (viewTp === 'list') {
                //currentCollection.forEach(function (template) {
                //    innerContext = self.templateListItem(template) + innerContext;
                //});
                this.$el.find('#allTemplatesCont').html(this.templateList({tempList : currentCollection}));
            }

            this.$el.find('#allTemplatesCont').html(innerContext);
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
