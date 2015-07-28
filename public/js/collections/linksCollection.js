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

        initialize: function(){
            this.fetch({
                reset: true,
                success: function(coll){
                    console.log(coll.toJSON())
                }
            });
        }
    });

    return LinksCollection;
});