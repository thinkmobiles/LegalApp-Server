/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/menu/topBarTemplate.html',
    'text!templates/menu/leftBarTemplate.html',
    'views/menu/iWantToView',
    'views/menu/contactUsView'
], function (TopTemplate, LeftTemplate, WantView, ContactView) {

    var View;
    View = Backbone.View.extend({

        el: '#topMenu',

        events: {
            'click #buttonLogout'   : 'logout',
            'click #profileTop'     : 'showPofile',
            'click #middleTopBar'   : 'showWantForm',
            'click #leftTopBar'     : 'showContactUsForm'
        },

        initialize: function () {
            this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.listenTo(App.sessionData, 'change:first_name change:last_name', this.renderUser);
            this.listenTo(App.Badge,       'change:pendingUsers', this.updatePendingUsersBadge);
        },

        showWantForm : function(){
            if (this.iWantView){
                this.iWantView.undelegateEvents();
            }

            this.iWantView = new WantView();
        },

        showContactUsForm : function(){
            if (this.contactUsView){
                this.contactUsView.undelegateEvents();
            }

            this.contactUsView = new ContactView();
        },

        getAvatar : function (){
            var image = this.$el.find('#topBarLogo');

                if (App.sessionData.get('authorized')) {
                    $.ajax({
                        url: "/getAvatar",
                        type: "GET",

                        success: function (res) {
                            image.attr('src', res)
                        }
                    });
                }
            },

        logout: function () {
            $.ajax({
                url  : "/signOut",
                type : "POST",

                success: function () {
                    $('body').removeClass('loggedState');

                    App.Events.trigger('logout');
                    App.sessionData.set({
                        authorized : false,
                        companyId  : null,
                        userId     : null
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
            //var authorized = App.sessionData.get('authorized');
            //var user = App.sessionData.get('first_name') + ' ' +App.sessionData.get('last_name');
            //var data = {
            //    authorized : authorized,
            //    username   : user
            //};

            var data = App.sessionData.toJSON();

            this.$el.html(_.template(TopTemplate)(data));

            if (data.authorized) {
                $('#leftMenu').html(_.template(LeftTemplate));
                this.initializeBadges();
                if (App.Badge.attributes.pendingUsers) {
                    this.updatePendingUsersBadge();
                }
            }

            return this;
        },

        renderUser: function () {
            var authorized = App.sessionData.get('authorized');
            var user = App.sessionData.get('first_name') +' '+ App.sessionData.get('last_name');

            this.$el.find('.userName').html(user);
            this.getAvatar();

            return this;
        },

        updatePendingUsersBadge: function () {
            var count = App.Badge.attributes.pendingUsers;
            var container = $('.registrationsBadge');

            container.html(count);

            if (count) {
                container.removeClass('hide');
                container.addClass('show');
            } else {
                container.removeClass('show');
                container.addClass('hide');
            }
        },

        initializeBadges: function () {
            $.ajax({
                url: "/users/count",
                type: "GET",
                data: {
                    status: -1
                },
                success: function (response) {
                    App.Badge.set('pendingUsers', response.count);
                }
            });
        }
    });
    return View;
});
