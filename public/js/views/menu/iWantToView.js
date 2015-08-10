/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/menu/iWantToTemplate.html'

], function (WantTemp) {

    var View;
    View = Backbone.View.extend({

        id: "iWantTo",

        initialize: function () {
            this.render();
        },

        events : {
            'focusout #iWantTo' : 'closeVeiw'
        },

        closeVeiw: function (){
            this.remove()
        },

        render: function () {
            this.$el.html(_.template(WantTemp));

            this.$el.find('#wantSearch').focus();

            return this;
        }

    });

    return View;

});