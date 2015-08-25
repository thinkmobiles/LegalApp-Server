/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/menu/iWantToTemplate.html'

], function (WantTemp) {

    var View;
    View = Backbone.View.extend({

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
            this.$el.html(_.template(WantTemp))
                .dialog({
                    closeOnEscape: false,
                    autoOpen: true,
                    dialogClass: "iWantDialog",
                    modal: true,
                    width: "600px",
                    close : function(){
                        self.remove()
                    }
                });

            return this;
        }

    });

    return View;

});