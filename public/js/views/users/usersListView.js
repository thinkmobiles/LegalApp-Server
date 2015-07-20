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
            this.currentUsersList = options.usrList;
            this.render()
        },

        render: function () {
            var self = this;
            console.log((self.currentUsersList));
            this.$el.html(_.template(UsrListTemp,{usrList : self.currentUsersList}));
            return this;
        }

    });
    return View;
});