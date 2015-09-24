/**
 * Created by root on 15.09.15.
 */

define([
], function () {
    var TittleCollection = Backbone.Collection.extend({

        searchParams : {},
        page         : 1,

        url:  "/documents/list",

        initialize: function(){

        },

        /*letsSearch: function (options) {
            var searchOptions = options || {};
            var self = this;

            this.fetch({
                data  : searchOptions,
                reset : true,
                success : function(){
                    var bb = self.at(0).get('id');
                    self.trigger('trueSearch', bb);
                }
            });
        },*/

        showMore: function (options) {
            var searchOptions = this.searchParams;
            var self = this;
            var needAppend = true;
            var firstEl;

            if (options && options.first){
                needAppend = false;
                self.page = 1;
            }

            searchOptions.page = self.page;
            searchOptions.count = 50;

            this.fetch({
                data    : searchOptions,
                reset   : true,
                success : function(){
                    self.page += 1;
                    if (needAppend) {
                        self.trigger('showMore', false);
                    } else {
                        //firstEl = self.at(0).get('id');
                        self.trigger('showMore', firstEl);
                    }
                }
            });
        }
    });

    return TittleCollection;
});