/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/termsAndConditions/termsAndConditionsTemplate.html',
    'views/castom/signatureView'
], function (template , SigView) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {
            "click #testButton" : "testEvent"
        },

        testEvent: function(){
            new SigView();
        },

        render: function () {
            this.$el.html(_.template(template));
            return this;
        }

    });

    return View;

});