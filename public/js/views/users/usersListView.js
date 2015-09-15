/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersListTemplate.html'

], function (UsrListTemp) {

    var View;

    View = Backbone.View.extend({

        //id      : "listTable",
        //tagName : "table",
        el : '#usersTable',

        events: {

        },

        initialize: function (options) {
            this.currentUsersList = options.coll;
            this.state = options.state;

            this.render()
        },

        render: function () {

            //$("#listTable").html(_.template(UsrListTemp)({usrLst : this.currentUsersList.toJSON()}));
            this.$el.html(_.template(UsrListTemp)({
                usrLst : this.currentUsersList.toJSON(),
                state  : this.state
            }));

            //this.$el.find('#listTable').mCustomScrollbar({
            //    axis:"x"
            //});

            return this;
        }

    });
    return View;
});