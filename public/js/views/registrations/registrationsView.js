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
            this.pendingCollection.on('add', this.renderPendingUsers, this);
            this.pendingCollection.on('remove', this.removePendingUser, this);

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

            this.pendingCollection.add(data.models);
            App.Badge.set('pendingUsers', users.length);

            pendingContainer.html(this.userListTemplate({usrLst: users, pending: true}));
            return this;
        },

        renderConfirmedUsers: function (data) {
            var users = data.toJSON();
            var confirmedContainer = this.$el.find('.confirmed');

            //this.confirmedCollection = new UsersCollection(data.models);
            this.confirmedCollection.add(data.models);

            confirmedContainer.html(this.userListTemplate({usrLst: users, pending: false}));

            return this;
        },

        removePendingUser: function (userModel) {
            var userId = userModel.id;
            var count = this.pendingCollection.length;

            this.$el.find('.pending tr[data-id=' + userId + ']').remove();
            App.Badge.set('pendingUsers', count);
        },

        generateUserRow: function (user) {
            var permissions = user.permissions;
            var status = user.status;
            var tr = '<tr class="userRow" data-id="' + user.id + '">';

            tr += '<td>' + user.first_name + ' ' + user.last_name + '</td>';
            tr += '<td>' + user.company_name + '</td>';

            if (permissions === 1) {   //role
                tr += '<td>Admin</td>';
            } else if (permissions === 2) {
                tr += '<td>Editor</td>';
            } else {
                tr += '<td>Viewer</td>';
            }

            if (permissions === 3) {  //description
                tr += '<td>Can view but not edit</td>';
            }

            if (status === -1) {    //status
                tr += '<td>Pending</td>';
            } else if (status === 0) {
                tr += '<td>Deleted</td>';
            } else if (status === 1) {
                tr += '<td>Active</td>';
            } else {
                tr += '<td></td>';
            }

            tr += '</tr>';

            return tr;
        },

        addConfirmedUser: function (userModel) {
            var user = userModel.toJSON();
            var tr = this.generateUserRow(user);
            var confirmedContainer = this.$el.find('.confirmed tbody');

            confirmedContainer.prepend(tr);
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
            var userModel = this.pendingCollection.get(userId);
            var self = this;

            $.ajax({
                url  : "/users/" + userId + '/' + type,
                type : "POST",
                success: function () {
                    alert('success');
                    //self.pendingCollection.remove(userId);
                },
                error: function (response, xhr) {
                    //self.errorNotification(err);
                    alert(response.responseText);
                    self.pendingCollection.remove(userId);
                    self.confirmedCollection.add(userModel);
                }
            });
        }
    });

    return View;
});