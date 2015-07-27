/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/resetPassword/resetPasswordTemplate.html'

], function (ResetTemplate) {

    var View;

    View = Backbone.View.extend({

        events: {
            "click #savePass" : "changePassword"
        },

        initialize: function () {
            this.render()
        },

        setParams: function (params) {
            this.token=params.token;
            this.render()
        },

        changePassword: function(){
            var token  = this.token;
            var password = this.$el.find('#newPass').val().trim();
            var confirmPassword = this.$el.find('#confirmPass').val().trim();

            // ============ todo please
            if (password === confirmPassword) {
            // =====================END

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
                    error: function () {
                        alert('Password error');
                    }
                });
            } else {
                alert('CONFIRM ERROR'); //todo
            }
        },

        render: function () {
            this.$el.html(_.template(ResetTemplate));
            return this;
        }

    });
    return View;
});