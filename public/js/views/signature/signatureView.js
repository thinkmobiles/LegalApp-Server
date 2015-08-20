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

            $.ajax({
                url : myUrl,
                success : function(response){
                    //something
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

        },

        render: function () {
            this.$el.html(_.template(SignatureTemp));
            this.getOurPreview();
            return this;
        }

    });

    return View;

});