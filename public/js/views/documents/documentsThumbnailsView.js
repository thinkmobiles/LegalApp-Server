/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsThumbnailsTemplate.html'
], function (ThumbnailsTemplate) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(ThumbnailsTemplate));
            return this;
        }

    });

    return View;

});