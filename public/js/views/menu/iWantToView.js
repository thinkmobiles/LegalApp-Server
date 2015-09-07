/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/menu/iWantToTemplate.html'
], function (WantTemp) {

    var View;
    View = Backbone.View.extend({

        template: _.template(WantTemp),

        initialize: function () {
            this.getCollection();
            this.render();
        },

        events : {
            'focusout #iWantTo' : 'closeView',
            'click .templateName': 'closeView'
        },

        closeView: function (){
            this.remove();
        },

        render: function () {
            var self = this;

            this.$el.html(this.template())
                .dialog({
                    closeOnEscape: false,
                    autoOpen: true,
                    dialogClass: "iWantDialog",
                    modal: true,
                    width: "600px",
                    close : function(){
                        self.closeView();
                    }
                });

            return this;
        },

        renderItems: function (collection) {
            var container = this.$el.find('ul');
            var html = '';

            collection.forEach(function (item) {
                var id = item.id;
                var li = '<li class="templateName" data-id="' + id + '">';
                li += '<a href="#templates/preview/' + id + '">' + item.name + '</a>';
                li += '</li>';
                html += li;
            });

            container.html(html);

            return this;
        },

        getCollection: function () {
            var self = this;

            $.ajax({
                url: '/documents/list?orderBy=count&page=1&count=5',
                type : 'GET',
                success: function (response) {
                    self.renderItems(response);
                },
                error: function (response, xhr) {
                    self.errorNotification(xhr);
                }
            });
        }

    });

    return View;

});