/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/addUserTemplate.html'

], function (AddUserTemplate) {

    var View;

    View = Backbone.View.extend({


        events: {

        },

        initialize: function () {
            this.render()
        },

        render: function () {
            this.$el.html(_.template(AddUserTemplate));
            return this;
        }

    });
    return View;
});