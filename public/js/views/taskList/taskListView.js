/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/taskList/taskListTemplate.html'

], function (TaskTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.render();
        },

        events : {

        },

        render: function () {
            this.$el.html(_.template(TaskTemp));
            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_task').addClass('active')
        }

    });

    return View;

});