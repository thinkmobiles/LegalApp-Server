/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/confirmEmail/confirmEmailTemplate.html'

], function (ConfirmTemplate) {

    var View;

    View = Backbone.View.extend({

        id : 'addUserForm',

        events: {
            "click #confirmButton" : "goToLogin"
        },

        initialize: function () {
            this.render()
        },

        setParams: function (params) {
            this.token=params.token;
            if (this.token) {
                this.checkLogin()
            }
        },

        goToLogin: function(){
            Backbone.history.navigate('login', {trigger : true});
        },

        checkLogin: function(){
            var token  = this.token;
            var thisEl = this.$el;

            $.ajax({
                url  : "/confirmEmail/" + token,
                type : "GET",
                success: function () {
                    thisEl.find('#confirmText').text('Your account has been activated!');
                    thisEl.find('#confirmButton').text('go to login');
                },
                error: function () {
                    //App.error(err);
                    thisEl.find('#confirmText').text('Wrong activation code!');
                }
            });
        },

        render: function () {
            this.$el.html(_.template(ConfirmTemplate));
            return this;
        }

    });
    return View;
});