/**
 * Created by root on 15.09.15.
 */

define([
], function () {
    var LinksCollection = Backbone.Collection.extend({

        tempId       : null,
        searchParams : {},
        page         : 1,

        url: function (){
            return this.tempId ? "/documents/list/"+this.tempId : "/documents/list"
        },

        initialize: function(){
        },

        showMore: function (options) {
            var searchOptions = this.searchParams;
            var self = this;
            var needReset = false;

            if (options && options.first){
                needReset = true;
                self.page = 1;
            }

            this.fetch({
                data    : searchOptions,
                reset   : needReset,
                success : function(){
                    self.page += 1;
                    if (!self.first){
                        self.trigger('showMore');
                    }
                }
            });
        }
    });

    return LinksCollection;
});