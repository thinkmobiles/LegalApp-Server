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
            var needAppend = true;

            if (options && options.first){
                needAppend = false;
                self.page = 1;
            }

            searchOptions.page = self.page;
            searchOptions.count = 20;

            this.fetch({
                data    : searchOptions,
                reset   : true,
                success : function(){
                    self.page += 1;
                    self.trigger('showMore', needAppend);
                }
            });
        }
    });

    return LinksCollection;
});