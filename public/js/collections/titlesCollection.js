/**
 * Created by root on 15.09.15.
 */

define([
], function () {
    var TittleCollection = Backbone.Collection.extend({

        url:  "/documents/list",

        initialize: function(){

        },

        letsSearch: function (options) {
            var searchOptions = options || {};
            var self = this;

            this.fetch({
                data  : searchOptions,
                reset : true,
                success : function(){
                    var bb = self.models[0].get('id');
                    self.trigger('trueSearch', bb);
                }
            });
        }
    });

    return TittleCollection;
});