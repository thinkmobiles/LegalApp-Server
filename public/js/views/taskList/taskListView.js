/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/taskList/taskListTemplate.html'

], function (TaskTemp) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {

        },

        render: function () {
            this.$el.html(_.template(TaskTemp));
            return this;
        }

    });

    return View;

});