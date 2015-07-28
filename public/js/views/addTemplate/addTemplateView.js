/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/addTemplate/addTemplateTemplate.html',
    'views/addLinkTable/addLinkTableView'
], function (TempTemplate, AddLinkView) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {
            "click #tempLinkTable" : "showLinksTable"
        },

        showLinksTable: function(){
            new AddLinkView();
        },

        render: function () {
            this.$el.html(_.template(TempTemplate));
            return this;
        }

    });

    return View;

});