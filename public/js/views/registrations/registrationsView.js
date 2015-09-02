'use strict';

define([
    'text!templates/registrations/registrationsTemplate.html',
    'collections/usersCollection',
    'text!templates/registrations/usersList.html'

], function (RegistrationsTemplate, UsersCollection, UserListTemplate) {

    var View;

    View = Backbone.View.extend({
        template: _.template(RegistrationsTemplate),
        userListTemlpate: _.template(UserListTemplate),

        el: "#wrapper",

        events: {
            "click .accept": "acceptRegistration",
            "click .reject": "rejectRegistration"
        },

        initialize: function () {
            this.pendingCollection = new UsersCollection({ status: -1 });
            this.confirmedCollection = new UsersCollection({ status: 1 });

            this.pendingCollection.on('reset', this.renderPendingUsers, this);
            this.confirmedCollection.on('reset', this.renderConfirmedUsers, this);

            this.render();
        },

        render: function () {
            this.$el.html(this.template);
            return this;
        },

        renderPendingUsers: function (data) {
            var users = data.toJSON();
            var pendingContainer = this.$el.find('.pending');

            if (users) {
                this.pendingCollection = new UsersCollection(data.models);
            }

            pendingContainer.html(this.userListTemlpate({usrLst: users, pending: true}));

            return this;
        },

        renderConfirmedUsers: function (data) {
            var users = data.toJSON();
            var confirmedContainer = this.$el.find('.confirmed');

            if (users) {
                this.confirmedCollection = new UsersCollection(data.models);
            }

            confirmedContainer.html(this.userListTemlpate({usrLst: users, pending: false}));

            return this;
        },

        acceptRegistration: function (event) {
            this.acceptOrReject(event, 'accept');
        },

        rejectRegistration: function (event) {
            this.acceptOrReject(event, 'reject');
        },

        acceptOrReject: function (event, type) {
            var target = $(event.target).closest('.' + type);
            var row = target.closest('tr');
            var userId = row.data('id');
            var self = this;

            $.ajax({
                url  : "/users/" + userId + '/' + type,
                type : "POST",
                success: function () {
                    alert('success');
                },
                error: function (err) {
                    //self.errorNotification(err);
                }
            });
        }
    });

    return View;
});