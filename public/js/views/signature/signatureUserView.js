
define([
    'text!templates/signature/signatureUserTemplate.html',
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
                error : function (err){
                    self.errorNotification(err);
                }
            });
        },

        acceptDocument: function(){
            var signatureView = new SignView();
            signatureView.on('iAccept', this.iAcceptDocument, this);
        },

        iAcceptDocument: function (signatureImg){
            var self = this;

            $.ajax({
                url:  '/documents/signature/user/'+this.token,
                type : 'POST',
                data : {signature : signatureImg},
                success : function (res) {
                    self.onSuccessAccept(res);
                },
                error: function(err){
                    self.errorNotification(err)
                }
            });
        },

        onSuccessAccept: function (res) {
            var document = res.document;
            var documentId = document.id;
            var downloadUrl = document.File.url;
            var container = this.$el.find('#forDocSigning');
            var self = this;
            var html = '';

            alert('Document was accepted successfully.');

            html += '<div class="signedDocument">';
            html += '  <div class="download"><a href="' + downloadUrl + '" target="_blank">Download</a></div>';
            html += '  <div class="preview"></div>';
            html += '</div>';

            this.$el.find('#acceptBtn').hide();
            container.html(html);

            $.ajax({
                url:  '/documents/' + documentId + '/preview',
                type : 'GET',
                success : function (res) {
                    self.renderTheSignedDocument(res);
                },
                error: function(err){
                    self.errorNotification(err)
                }
            });
        },

        render: function () {
            this.$el.html(_.template(SignatureTemp));
            this.getOurPreview();

            return this;
        },

        renderTheSignedDocument: function (previewHtml) {
            this.$el.find('.preview').html(previewHtml);
        }

    });

    return View;

});