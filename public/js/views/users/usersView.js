/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html'

], function (UsersTemplate) {

    var View;

    View = Backbone.View.extend({


        events: {

        },

        initialize: function () {
            this.render()
        },

        render: function () {

            return this;
        }

    });
    return View;
});
