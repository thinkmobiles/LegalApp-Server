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
        template_list : _.template(TempList),
        template_grid : _.template(TempGrid),

        initialize: function (options) {
            this.render();

            this.tempCollection = new TempCollection();
            this.stateModel = new Backbone.Model();
            this.stateModel.set('viewType', options.viewType);

            this.listenTo(this.tempCollection, 'reset add', this.renderAlltemplates);
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
            var self = this;
            var currentView =  new AddTemplate({parentCont : this});

            //currentView.on('addInParentView', this.addOneGrid, this);
            //currentView.listenTo(self.tempCollection, 'add', self.renderAlltemplates);
            //currentView.on('addInParentView', this.renderAlltemplates, this);
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
            var currentCollection = this.tempCollection.toJSON();
            var viewTp = this.stateModel.get('viewType');
            var tempName = 'template_' + viewTp;
            var urlName = 'templates/'+viewTp;

            this.$el.find('#allTemplatesCont').html(this[tempName]({tempList : currentCollection}));
            Backbone.history.navigate(urlName);
        },

        /*addOneGrid: function(model){
            //var viewTp = this.stateModel.get('viewType');
            this.tempCollection.add(model);

            //if (viewTp === 'grid') {
            //    this.$el.append(this.templateGridItem(model));
            //}
            //
            //if (viewTp === 'list') {
            //    this.$el.find('#allTemplatesCont>ul').append(this.templateListItem(model));
            //}


        },*/

        render: function () {

            this.$el.html(TempTemplate);
            return this;
        }

    });

    return View;

});
