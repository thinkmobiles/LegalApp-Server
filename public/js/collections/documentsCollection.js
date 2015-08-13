/**
 * Created by root on 13.08.15.
 */

define([
    'models/documentModel'

], function (DocumentModel) {
    var DocumentCollection = Backbone.Collection.extend({
        model: DocumentModel,

        url: function () {
            return "/documents"
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

    return DocumentCollection;
});