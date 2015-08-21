/**
 * Created by root on 20.08.15.
 */

define([
    'text!templates/signature/signatureTemplate.html',
    'views/custom/signatureBoxView'

], function (SignatureTemp, SignView) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function (options) {
            this.token = options.token;

            this.render();
        },

        events : {
            "click #acceptBtn" : "acceptDocument"
        },

        getOurPreview: function () {
            var myUrl = '/documents/'+this.token+'/signature';
            var self = this;

            $.ajax({
                url : myUrl,
                success : function(response){
                    self.currentHtml = response;
                    self.$el.find('#forDocSigning').html(response);
                },
                error : function (){
                    alert('Error');
                }
            });
        },

        acceptDocument: function(){
            var signatureView = new SignView();
            signatureView.on('iAccept', this.iAcceptDocument, this);
        },

        iAcceptDocument: function (signatureImg){

            $.ajax({
                url:  '/documents/'+this.token+'/signature',
                type : 'POST',
                data : {signature : signatureImg},
                success : function(){
                    alert('Success');
                },
                errror: function(){
                    alert('Error');
                }
            });

        },

        render: function () {
            this.$el.html(_.template(SignatureTemp));
            this.getOurPreview();
            return this;
        }

    });

    return View;

});