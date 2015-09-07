'use strict';

define([
    'text!templates/newUsers/newUsersTemplate.html',
    'collections/usersCollection',
    'text!templates/newUsers/newUsers.html'

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

            App.Collections.pendingCollection = this.pendingCollection;
            App.Collections.confirmedCollection = this.confirmedCollection;

            this.pendingCollection.on('reset', this.renderPendingUsers, this);
            this.pendingCollection.on('add', this.addPendingUser, this);
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

        addPendingUser: function (userModel) {
            var user = userModel.toJSON();
            var tr = this.generateUserRow(user);
            var container = this.$el.find('.pending tbody');

            container.prepend(tr);
            App.Badge.set('pendingUsers', this.pendingCollection.length);
        },

        removePendingUser: function (userModel) {
            var userId = userModel.id;
            var count = this.pendingCollection.length;

            this.$el.find('.pending tr[data-id=' + userId + ']').remove();
            App.Badge.set('pendingUsers', count);
        },

        generateUserRow: function (user) {
            var status = user.status;
            var permissions = user.profile.permissions;
            var tr = '<tr class="userRow" data-id="' + user.id + '">';

            tr += '<td>' + user.profile.first_name + ' ' + user.profile.last_name + '</td>'; //NAME
            tr += '<td>' + user.company.name + '</td>';                                      //COMPANY

            switch (permissions) {
                case 0:
                    tr += '<td>Admin</td>';
                    break;
                case 1:
                    tr += '<td>Admin</td>';
                    break;
                case 2:
                    tr += '<td>Editor</td>';
                    break;
                case 3:
                    tr += '<td>Viewer</td>';
                    break;
                case 11:
                    tr += '<td>Client Admin</td>';
                    break;
                case 12:
                    tr += '<td>Client Editor</td>';
                    break;
                case 13:
                    tr += '<td>Client Viewer</td>';
                    break;
                default:
                    tr += '<td>Viewer</td>';
            }

            if (permissions === 3) {                                                        //DESCRIPTION
                tr += '<td>Can view but not edit</td>';
            } else {
                tr += '<td></td>';
            }

            if (status === -1) {                                                           //STATUS
                tr += '<td>Pending</td>';
            } else if (status === 0) {
                tr += '<td>Deleted</td>';
            } else if (status === 1) {
                tr += '<td>Active</td>';
            } else {
                tr += '<td></td>';
            }

            if (status === -1) {
                tr += '<td><button class="accept">Accept</button> | <button class="reject">Reject</button></td>';
            }

            tr += '</tr>';

            return tr;
        },

        addConfirmedUser: function (userModel) {
            var user = userModel.toJSON();
            var tr = this.generateUserRow(user);
            var container = this.$el.find('.confirmed tbody');

            container.prepend(tr);
        },

        acceptRegistration: function (event) {
            var target = $(event.target).closest('.accept');
            var row = target.closest('tr');
            var userId = row.data('id');
            var userModel = this.pendingCollection.get(userId);
            var self = this;

            userModel.set('status', 1);

            $.ajax({
                url  : '/users/' + userId + '/accept',
                type : 'POST',
                success: function () {
                    self.pendingCollection.remove(userId);
                    self.confirmedCollection.add(userModel);
                },
                error: function (response, xhr) {
                    self.pendingCollection.remove(userId);
                    self.confirmedCollection.add(userModel);
                }
            });
        },

        rejectRegistration: function (event) {
            var target = $(event.target).closest('.reject');
            var row = target.closest('tr');
            var userId = row.data('id');
            var userModel = this.pendingCollection.get(userId);
            var self = this;

            userModel.set('status', 0);

            $.ajax({
                url  : '/users/' + userId + '/reject',
                type : 'POST',
                success: function () {
                    self.pendingCollection.remove(userId);
                    self.confirmedCollection.add(userModel);
                },
                error: function (response, xhr) {
                    self.pendingCollection.remove(userId);
                    self.confirmedCollection.add(userModel);
                }
            });
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_nUser').addClass('active')
        }

    });

    return View;
});