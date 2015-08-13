/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsListTemplate.html'

], function (DocTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemp : _.template(DocTemp),

        initialize: function () {
            this.groupCollection = new Backbone.collection();
            this.groupCollection.url = '/documents/list';
            this.listenTo(this.groupCollection,'reset',this.render);

            this.groupCollection.fetch({reset : true});
        },

        events : {

        },

        render: function () {
            this.$el.html(this.mainTemp);
            return this;
        }

    });

    return View;

});