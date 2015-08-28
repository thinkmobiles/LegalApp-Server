/**
 * Created by root on 21.08.15.
 */

define([
    'text!templates/templatesPreview/docPreviewTemplate.html'

], function (DocTemp) {

    var View;
    View = Backbone.View.extend({

        initialize: function (options) {
            this.tempId = options.modelId;
            this.temporaryValues = options.modelValues;

            this.render();
        },

        events : {
            //"click #sendAndSignBtn" : "sendMyDoc",
            "click #modalBack" : "closeDialog",
            "click #modalSave" : "saveFromDialog",
            "click #modalSend" : "saveFromDialog"
        },

        drawDocument: function(){
            var self = this;
            var saveData;

            saveData = {values : this.temporaryValues};

            $.ajax({
                url         : "/templates/"+this.tempId+"/previewDocument",
                type        : "POST",
                contentType : "application/json; charset=utf-8",
                dataType    : "json",
                data        : JSON.stringify(saveData),

                success : function(response){
                    self.$el.find('#forDocSigning').html(response.htmlContent);
                },
                error   : function(model, xhr){
                    alert('Error');
                }
            });
        },

        //sendMyDoc: function(){
        //    var self = this;
        //
        //    $.ajax({
        //        url : "/documents/"+this.tempId+"/send",
        //        success : function(){
        //            alert('A document was sent successfully');
        //            Backbone.history.navigate('/documents/list', {trigger : true});
        //        },
        //        error : function(model){
        //            alert('Error on sending');
        //            //self.errorNotification(model);
        //        }
        //    });
        //},

        closeDialog: function(){
            this.remove();
        },

        saveFromDialog: function(event){
            var status = $(event.target).data('val');

            this.trigger('saveInParent', status);
        },

        render: function () {
            var self = this;

            this.undelegateEvents();
            this.$el.html(_.template(DocTemp))
                .dialog({
                    closeOnEscape: false,
                    autoOpen: true,
                    dialogClass: "modalDocPreview",
                    modal: true,
                    width: "800px",
                    close : function(){
                        self.remove()
                    }
                });
            this.delegateEvents();
            this.drawDocument();

            return this;
        }

    });

    return View;

});