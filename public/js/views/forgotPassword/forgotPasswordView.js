/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/forgotPassword/forgotPasswordTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({

        id : 'addUserForm',

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(template));
            return this;
        }

    });

    return View;

});