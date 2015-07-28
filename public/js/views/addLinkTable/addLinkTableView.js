/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/addLinkTable/addLinkTableTemplate.html',
    'text!templates/addLinkTable/linksListTemplate.html'
], function (AddTemplate, ListTemplate) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {

        },

        render: function () {

            this.undelegateEvents();
            this.$el.html(_.template(AddTemplate)).dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "dialogWindow",
                modal: true,
                width: "600px"
            });
            this.delegateEvents();

            return this;
        }

    });

    return View;

});