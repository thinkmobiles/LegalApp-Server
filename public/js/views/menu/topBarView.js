/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/menu/topBarTemplate.html',
    'text!templates/menu/leftBarTemplate.html'
], function (TopTemplate, LeftTemplate) {

    var View;
    View = Backbone.View.extend({

        el: '#topMenu',

        events: {
            'click #buttonLogout'   : 'logout'
        },

        initialize: function () {
            this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.listenTo(App.sessionData, 'change:user', this.render);

            this.render();
        },

        logout: function () {
            $.ajax({
                url  : "/signOut",
                type : "POST",

                success: function () {
                    $('#topMenu').hide();
                    $('#leftMenu').hide();
                    App.sessionData.set({
                        authorized : false,
                        user       : null
                    });
                    App.router.navigate("login", {trigger: true});
                },
                error: function (err) {
                    //App.error(err);
                    alert('Error'+err);
                }
            });
        },

        render: function () {
            var authorized = App.sessionData.get('authorized');
            var user = App.sessionData.get('user');

            var data = {
                authorized : authorized,
                username   : user
            };

            this.$el.html(_.template(TopTemplate)(data));
            $('#leftMenu').html(_.template(LeftTemplate));
            return this;
        }
    });
    return View;
});