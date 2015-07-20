/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersListTemplate.html'

], function (UsrListTemp) {

    var View;

    View = Backbone.View.extend({

        id      : "listTable",
        tagName : "tbody",

        events: {

        },

        initialize: function () {
            this.currentUsersList = new Backbone.Collection();
            this.currentUsersList.add({name : 'name1', role : 'role1'});
            this.currentUsersList.add({name : 'name2', role : 'role2'});
            this.currentUsersList.add({name : 'name3', role : 'role3'});

            this.render()
        },

        render: function () {

            var usrList = this.currentUsersList.toJSON();
            $("#listTable").html(_.template(UsrListTemp)({usrList : usrList}));

            return this;
        }

    });
    return View;
});