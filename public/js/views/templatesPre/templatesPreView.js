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
            this.startId = options.id;

            if (this.tempType === 'documents'){
                this.docModel = new DocModel({id : this.startId});
                this.docModel.fetch({
                    success: function(response){
                        self.tempId = response.get('template_id');
                        self.createStateModel(self.tempId);
                    }
                });
            } else {
                self.tempId = self.startId;
                self.createStateModel(self.tempId);
            }
        },

        events : {
            "click #createDoc" : "openCreateForm"
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

        findPreview: function(){
            var id = this.tempId;
            var myDocContainer = this.$el.find('#previewContainer');

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


            this.$el.html(this.currentTemp);

            this.findPreview();
            if (this.tempType === 'documents'){
                this.openCreateForm()
            }

            return this;
        }

    });

    return View;

});