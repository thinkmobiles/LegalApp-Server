/**
 * Created by root on 28.07.15.
 */

define([
    'models/templateModel'
], function (TemplateModel) {
    var TemplateCollection = Backbone.Collection.extend({
        model: TemplateModel,

        url: function () {
            return "/templates"
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

    return TemplateCollection;
});