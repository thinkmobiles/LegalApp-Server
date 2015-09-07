/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/help/helpTemplate.html'

], function (HelpTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.render();
        },

        events : {
            "click #helpSend" : "letsSendMail"
        },

        letsSendMail: function(){
            var this_el = this.$el;
            var eMail = this_el.find('#helpEmail').val().trim();
            var subject = this_el.find('#helpSubject').val().trim();
            var emailText = this_el.find('#helpText').val().trim();

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
                    alert('Your message was sent successfully');
                }
            });
        },

        render: function () {
            this.$el.html(_.template(HelpTemp));
            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_help').addClass('active')
        }

    });

    return View;

});