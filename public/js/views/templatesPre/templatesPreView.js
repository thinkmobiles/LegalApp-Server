/**
 * Created by root on 11.08.15.
 */

define([
    'text!templates/templatesPreview/tempPreviewTemplate.html',
    'views/templatesPre/createDocument/createDocumentView',
    'models/templateModel',
    'models/documentModel'

], function (PreviwTemp, CreateView, TempModel, DocModel) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        currentTemp : _.template(PreviwTemp),

        initialize: function (options) {
            var self = this;
            this.tempType = options.docType;
            var startId = options.id;
            var tempId = startId;

            if (this.tempType === 'documents'){
                this.docModel = new DocModel({id : startId});
                this.docModel.fetch({
                    success: function(response){
                        tempId = response.get('template_id');
                        self.createStateModel(tempId);
                    }
                });
            } else {
                tempId = startId;
                self.createStateModel(tempId);
            }
        },

        events : {
            "click #createDoc"  : "openCreateForm",
            "click .showLinked" : "showLinkedPreview"
        },

        createStateModel: function(id){
            this.stateModel = new TempModel({id : id});
            this.stateModel.on('sync', this.render, this);
            this.stateModel.fetch();
        },

        openCreateForm: function(){
            var tempModel = this.stateModel.toJSON();
            var currentView;
            var viewData = {
                model  : tempModel
            };

            if (this.docModel){
                viewData.modelDoc = this.docModel;
            }

            currentView = new CreateView(viewData);
            this.$el.find('#createDocContainer').html(currentView.el);
        },

        showLinkedPreview: function(event){
            var type = $(event.target).attr('data-val');
            var mainDiv = this.$el.find('#div_main');
            var secondId;
            var containerForPreview;

            if (type === "link"){
                containerForPreview = this.$el.find('#linkedPreviewContainer');

                if (containerForPreview.html() === ''){
                    secondId = this.stateModel.get('linkedTemplates')[0].id;
                    this.findPreview(secondId, containerForPreview);
                }
                mainDiv.switchClass('main_state','linked_state');
            } else {
                mainDiv.switchClass('linked_state','main_state');
            }
        },

        findPreview: function(id, container){
            var myDocContainer;

            if (container){
                myDocContainer = container
            } else {
                myDocContainer = this.$el.find('#previewContainer');
            }

            $.ajax({
                url  : '/templates/'+id+'/preview',
                type : 'GET',
                success : function(response){
                    myDocContainer.html(response);
                },
                error : function(){
                    alert('error'); //todo
                }
            });

        },

        render: function () {
            var tempModel = this.stateModel.toJSON();

            this.$el.html(this.currentTemp({tempModel : tempModel}));

            this.findPreview(tempModel.id);
            if (this.tempType === 'documents'){
                this.openCreateForm()
            }

            return this;
        }

    });

    return View;

});