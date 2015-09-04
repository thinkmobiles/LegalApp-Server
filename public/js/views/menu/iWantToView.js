/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/menu/iWantToTemplate.html',
    'collections/templatesCollection'
], function (WantTemp, TemplateCollection) {

    var View;
    View = Backbone.View.extend({

        template: _.template(WantTemp),

        initialize: function () {
            this.collection = new TemplateCollection();
            this.collection.on('reset', this.render, this);
            this.getCollection();
        },

        events : {
            'focusout #iWantTo' : 'closeView',
            'click .templateName': 'closeView'
        },

        closeView: function (){
            this.remove();
        },

        render: function () {
            var items = this.collection.toJSON();
            var self = this;

            this.$el.html(this.template({items: items}))
                .dialog({
                    closeOnEscape: false,
                    autoOpen: true,
                    dialogClass: "iWantDialog",
                    modal: true,
                    width: "600px",
                    close : function(){
                        self.closeVeiw()
                    }
                });

            return this;
        },

        getCollection: function () {
            var self = this;

            $.ajax({
                url  : '/templates/',
                type : 'GET',
                success: function (response) {
                    self.collection.add(response);
                },
                error: function (response, xhr) {
                    self.errorNotification(xhr);
                }
            });
        }

    });

    return View;

});