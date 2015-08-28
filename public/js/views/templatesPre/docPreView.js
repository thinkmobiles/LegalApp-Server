/**
 * Created by root on 21.08.15.
 */

define([
    'text!templates/templatesPreview/docPreviewTemplate.html'

], function (DocTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function (options) {
            this.docId = options.modelId;

            this.render();
        },

        events : {
            "click #sendAndSignBtn" : "sendMyDoc"
        },

        drawDocument: function(){
            var self = this;

            $.ajax({
                url : "/documents/"+this.docId+"/preview",
                success : function(response){
                    self.$el.find('#forDocSigning').html(response);
                },
                error   : function(){}
            });
        },

        sendMyDoc: function(){
            var self = this;

            $.ajax({
                url : "/documents/"+this.docId+"/send",
                success : function(){
                    alert('A document was sent successfully');
                    Backbone.history.navigate('/documents/list', {trigger : true});
                },
                error : function(model){
                    alert('Error on sending');
                    //self.errorNotification(model);
                }
            });
        },

        render: function () {

            this.undelegateEvents();
            this.$el.html(_.template(DocTemp));
            this.delegateEvents();
            this.drawDocument();

            return this;
        }

    });

    return View;

});