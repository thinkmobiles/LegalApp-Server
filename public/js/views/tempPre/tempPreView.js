/**
 * Created by root on 11.08.15.
 */

define([
    'text!templates/tempPreview/tempPreviewTemplate.html',
    'views/tempPre/createDocument/createDocumentView',
    'models/templateModel'

], function (PreviwTemp, CreateView, TempModel) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        currentTemp : _.template(PreviwTemp),

        initialize: function (options) {
            this.tempId =options.id;

            this.stateModel = new TempModel({id : this.tempId});
            this.stateModel.on('sync', this.render, this);

            this.stateModel.fetch();
        },

        events : {
            "click #createDoc" : "openCreateForm"
        },

        openCreateForm: function(){
            var tempModel = this.stateModel.toJSON();
            var currentView = new CreateView({model : tempModel});
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

            return this;
        }

    });

    return View;

});