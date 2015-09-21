/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/termsAndConditions/termsAndConditionsTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {
            "click #acceptBtn.active" : "iAcceptTerms"
        },

        iAcceptTerms: function(){
            this.trigger('iAccept');
            this.remove();
        },

        makeThisBtnActive: function() {

        },

        render: function () {
            var self = this;

            self.undelegateEvents();
            self.$el.html(_.template(template)).dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "termsOfServiceDialog",
                modal: true,
                width: "600px",
                close : function(){
                    self.remove()
                }
            });
            self.delegateEvents();

            this.$el.find('.panel-body').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                setHeight           : 680,
                callbacks :{
                    onTotalScroll : function(){
                        self.$el.find('#acceptBtn').addClass('active');
                    }
                }
            });

            return this;
        }

    });

    return View;

});