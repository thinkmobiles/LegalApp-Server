/**
 * Created by root on 03.09.15.
 */

define([
    'text!templates/menu/contactUsTemplate.html'

], function (ContactTemp) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {
            'click #cuSend' : 'contactUsSend'
        },

        contactUsSend: function(){
            var self = this;
            var this_el = this.$el;
            var eMail = this_el.find('#cuEmail').val().trim();
            var subject = this_el.find('#cuSubject').val().trim();
            var emailText = this_el.find('#cuText').val().trim();

            var data = {
                email     : eMail,
                subject   : subject,
                emailText : emailText
            };

            $.ajax({
                url  : '/helpMe',
                type : 'POST',
                data :  data,
                success : function(){
                    self.remove();
                    alert('Your message was sent successfully');
                },
                error : function (xhr){
                    self.errorNotification(xhr);
                }
            });
        },

        closeVeiw: function (){
            this.remove()
        },

        render: function () {
            var self = this;
            this.$el.html(_.template(ContactTemp))
                .dialog({
                    closeOnEscape: false,
                    //autoOpen: true,
                    dialogClass  : "contactDialog",
                    modal        : true,
                    width        : "300px",
                    height       : "300px",
                    close : function(){
                        self.remove()
                    }
                });

            return this;
        }

    });

    return View;

});