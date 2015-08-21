/**
 * Created by root on 21.08.15.
 */

define([
    'text!templates/tempPreview/docPreviewTemplate.html'

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
            $.ajax({
                url : "/documents/"+this.docId+"/send",
                success : function(){
                    alert('A document was sent successfully');
                    Backbone.history.navigate('/documents/list', {trigger : true});
                },
                error : function(){
                    alert('Error on sending');
                }
            });
        },

        render: function () {
            this.$el.html(_.template(DocTemp));

            this.drawDocument()
            return this;
        }

    });

    return View;

});