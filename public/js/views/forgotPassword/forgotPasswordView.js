/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/forgotPassword/forgotPasswordTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.render();
        },

        events : {
            'click #sendPass'  : 'sendPass'
        },

        sendPass : function(){
            var thisEl = this.$el;
            var currentEmail = thisEl.find('#currentEmail').val().trim();
            $.ajax({
                url: "/forgotPassword",
                type: "POST",
                data: {
                    email: currentEmail
                },
                success: function () {
                    thisEl.find('#innerForgot').html("<p>Recovery password has been sent to "+currentEmail+" </p>");
                    thisEl.find('.hideRow').show();
                },
                error: function (err) {
                   // todo
                }
            });
        },

        render: function () {
            this.$el.html(_.template(template));
            return this;
        }

    });

    return View;

});