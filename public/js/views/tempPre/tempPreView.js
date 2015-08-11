/**
 * Created by root on 11.08.15.
 */

define([
    'text!templates/tempPreview/tempPreviewTemplate.html',
    'models/templateModel'

], function (PreviwTemp, TempModel) {

    var View;
    View = Backbone.View.extend({

        currentTemp : _.template(PreviwTemp),

        initialize: function (options) {
            this.tempId = options.id;

            this.render();
        },

        events : {

        },

        render: function () {
            this.$el.html(this.currentTemp);
            return this;
        }

    });

    return View;

});