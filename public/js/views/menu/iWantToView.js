/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/menu/iWantToTemplate.html'
], function (WantTemp) {
    var View = Backbone.View.extend({

        el: '#middleTopBar',

        template: _.template(WantTemp),

        initialize: function () {
            this.render();
        },

        events : {
            'click #iWantTo'      : 'showWantForm',
            'click .templateName' : 'closeView'
        },

        closeView: function (){
            this.$el.find('#iWantTo').removeClass('opened').addClass('closed');
            this.$el.find('ul').empty();
        },

        render: function () {
            this.$el.html(this.template());
        },

        showWantForm : function(){
            var title = this.$el.find('#iWantTo');

            if (title.hasClass('opened')) {
                title.removeClass('opened').addClass('closed');
                this.closeView();
            } else {
                title.removeClass('closed').addClass('opened');
                this.getCollection();
            }
        },

        renderItems: function (items) {

            //TODO: remove this will be used only for test:
            // --------------------------------------------
            var i = items.length;

            while (i<12) {
                items.push({
                    id: 6,
                    name: '--- ' + (i + 1) + ' ---'
                });
                i++;
            }

            // --------------------------------------------

            var container = this.$el.find('ul');
            var html = '';

            _.forEach(items, function (item) {
                var id = item.id;
                var li = '<li class="templateName" data-id="' + id + '">';

                li += '<a href="#templates/preview/' + id + '">' + item.name + '</a>';
                li += '</li>';
                html += li;
            });

            container.html(html);

            //this.$el.html(this.template({items: items}));

            /*this.$el.html(this.template())
                .dialog({
                    closeOnEscape: false,
                    autoOpen     : true,
                    dialogClass  : "iWantDialog",
                    modal        : true,
                    width        : "600px",
                    close : function(){
                        self.closeView();
                    }
                });*/

            return this;
        },

        getCollection: function () {
            var self = this;

            $.ajax({
                url  : '/templates/top',
                data : {
                    orderBy : 'count',
                    page    : 1,
                    count   : 5
                },
                success: function (response) {
                    self.renderItems(response);
                },
                error: function (err) {
                    self.errorNotification(err);
                }
            });
        }

    });

    return View;

});