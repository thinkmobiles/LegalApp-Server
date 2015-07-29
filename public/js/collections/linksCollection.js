/**
 * Created by root on 28.07.15.
 */

define([
    'models/linkModel'
], function (LinkModel) {
    var LinksCollection = Backbone.Collection.extend({
        model: LinkModel,

        url: function () {
            return "/links"
        },

        initialize: function(){}
    });

    return LinksCollection;
});