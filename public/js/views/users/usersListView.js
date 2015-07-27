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

        initialize: function (options) {
            this.currentUsersList = options.coll;

            this.render()
        },

        render: function () {

            $("#listTable").html(_.template(UsrListTemp)({usrLst : this.currentUsersList.toJSON()}));

            return this;
        }

    });
    return View;
});