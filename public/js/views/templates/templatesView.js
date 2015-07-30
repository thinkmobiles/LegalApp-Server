/**
 * Created by root on 30.07.15.
 */

define([
    'text!templates/templates/templatesTemplate.html',
    'collections/templatesCollection'

], function (TempTemplate, TempCollection) {

    var View;
    View = Backbone.View.extend({
        el: "#wrapper",

        template  : _.template(TempTemplate),

        initialize: function () {
            this.tempCollection = new TempCollection();

            this.listenTo(this.tempCollection, 'reset', this.render);
        },

        render: function () {

            this.$el.html(this.template({tmpLst : this.tempCollection.toJSON()}));

            return this;
        }

    });

    return View;

});