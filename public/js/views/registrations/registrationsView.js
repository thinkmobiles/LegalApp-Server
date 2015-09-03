'use strict';

define([
    'text!templates/registrations/registrationsTemplate.html',
    'collections/usersCollection',
    'text!templates/registrations/usersList.html'

], function (RegistrationsTemplate, UsersCollection, UserListTemplate) {

    var View;

    View = Backbone.View.extend({

        template: _.template(RegistrationsTemplate),
        userListTemplate: _.template(UserListTemplate),

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
            this.confirmedCollection.on('add', this.addConfirmedUser, this);

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

            App.Badge.set('pendingUsers', users.length);

            pendingContainer.html(this.userListTemplate({usrLst: users, pending: true}));

            return this;
        },

        renderConfirmedUsers: function (data) {
            var users = data.toJSON();
            var confirmedContainer = this.$el.find('.confirmed');

            if (users) {
                this.confirmedCollection = new UsersCollection(data.models);
            }

            confirmedContainer.html(this.userListTemplate({usrLst: users, pending: false}));

            return this;
        },

        addConfirmedUser: function (userModel) {
            var users = userModel.toJSON();
            var confirmedContainer = this.$el.find('.confirmed');

            confirmedContainer.html(this.userListTemplate({usrLst: users, pending: false}));
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
                    self.pendingCollection.remove(userId);
                },
                error: function (response, xhr) {
                    //self.errorNotification(err);
                    alert(response.responseText || response.responseJson.error);
                    self.pendingCollection.remove(userId);
                }
            });
        }
    });

    return View;
});