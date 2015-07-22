/**
 * Created by andrey on 22.07.15.
 */

define([
    'text!templates/resetPassword/resetPasswordTemplate.html'

], function (ResetTemplate) {

    var View;

    View = Backbone.View.extend({

        events: {

        },

        initialize: function () {
            this.render()
        },

        setParams: function (params) {
            this.token=params.token;
        },

        changePassword: function(){
            var token  = this.token;
            var thisEl = this.$el;

            $.ajax({
                url  : "/resetPassword/" + token,
                type : "GET",
                success: function () {
                    /*thisEl.find('#confirm').text('Your account has been activated!');*/
                },
                error: function () {
                    //App.error(err);
                    /*thisEl.find('#confirm').text('Wrong activation code!');*/
                }
            });
        },

        render: function () {
            this.$el.html(_.template(ResetTemplate));
            return this;
        }

    });
    return View;
});