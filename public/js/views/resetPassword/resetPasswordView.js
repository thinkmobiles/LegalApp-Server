/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/resetPassword/resetPasswordTemplate.html'

], function (ResetTemplate) {

    var View;

    View = Backbone.View.extend({

        el : '#wrapper',

        events: {
            "click #savePass" : "changePassword"
        },

        initialize: function (params) {
            this.token=params.token;

            this.render()
        },

        changePassword: function(){
            var self= this;
            var thisEl = self.$el;
            var token  = self.token;
            var password = thisEl.find('#newPass').val().trim();
            var confirmPassword = thisEl.find('#confirmPass').val().trim();

            if (password === confirmPassword) {

                $.ajax({
                    url: "/changePassword/"+token,
                    type: "POST",
                    data: {
                        password : password
                    }
                    ,
                    success: function () {
                        alert('Password was changed successfully');

                        Backbone.history.navigate("login", {trigger: true});
                    },
                    error: function (err) {
                        self.errorNotification(err);
                    }
                });
            } else {
                alert('Password mismatch');
            }
        },

        render: function () {
            this.$el.html(_.template(ResetTemplate));
            return this;
        }

    });
    return View;
});