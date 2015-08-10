/**
 * Created by root on 29.07.15.
 */

define([
    'text!templates/templates/templatesList.html'
], function (TempList) {

    var View;

    View = Backbone.View.extend({

        id      : "templatesList",
        tagName : "tbody",

        events: {
        },

        initialize: function (options) {
            this.currentTempList = options.coll;

            this.render()
        },

        render: function () {

            $('#templatesList').html(_.template(TempList)({tmpLst : this.currentTempList.toJSON()}));

            return this;
        }

    });
    return View;
});