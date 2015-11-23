/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/templates/templatesTemplate.html',
    'text!templates/templates/templatesGridTemplate.html',
    'text!templates/templates/templatesListTemplate.html',
    'views/templates/addTemplate/addTemplateView',
    'collections/templatesCollection'

], function (
    TempTemplate,
    TempGrid,
    TempList,
    AddTemplate,
    TempCollection) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

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
            "click #addDiv"        : "goToAddTemplate",
            "click .hovCreateD"    : "goToPreview",
            "click .btnViewType"   : "changeViewType",
            "click .hovEditT"      : "goToEditTemplate",
            "click .sel_item"      : "selectSomething",
            "click .sel_container" : "showHideSelect"
        },

        selectSomething: function(event){
            var target = $(event.target);
            var container = target.closest('.sel_container');
            var result = container.find('.sel_result');
            var newId;

            result.text(target.text());
            newId = target.attr('data-id');
            result.attr('data-id', newId);
        },

        showHideSelect: function(event){
            var target = $(event.target);

            target.closest('.sel_container').toggleClass('active');
        },

        changeViewType: function(event){
            var targetView = $(event.target).data('id');

            this.stateModel.set('viewType',targetView);
        },

        goToAddTemplate : function(){
            var currentView =  new AddTemplate({parentCont : this});

            this.$el.find('#addTemplateContainer').find('#addTemplateAppender').before(currentView.el);
        },

        goToEditTemplate : function(event){
            var tempId = $(event.target).closest('.tempGrid').data('id');
            var currentView = new AddTemplate({
                    parentCont : this,
                    tempId     : tempId
            });

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

        render: function () {

            this.$el.html(TempTemplate);
            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');

            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_template').addClass('active')
        }

    });

    return View;

});
