/**
 * Created by andrey on 23.07.15.
 */

define([
    'models/userModel'
], function (UserModel) {
    var UserCollection = Backbone.Collection.extend({

        model: UserModel,

        page    : 1,
        clients : false,

        url  : function(){
            return this.clients ? '/clients' : '/users'
        },

        //url: function () {
        //    if (this.clients) {
        //        return "/users"
        //    } else {
        //        return "/clients"
        //    }
        //},

        //url: "/users",

        initialize: function(options){

            if (options && options.status) {
                this.url = "/users/search?status=" + options.status;
            }
        },

        showMore: function(argOptions) {
            var self = this;
            var options = argOptions;
            var first;
            var fetchOptions = {};
            var paginationCollection = new Backbone.Collection();

            paginationCollection.url = this.url;
            paginationCollection.model = UserModel;

            if (options && options.first){
                first = true;
                self.page = 1;
            } else {
                first = false;
            }

            if (options && options.clients){
                self.clients = true;
            } else {
                self.clients = false;
            }

            fetchOptions.page = self.page;
            fetchOptions.count = 20;

            paginationCollection.fetch({
                data   : fetchOptions,
                reset  : true,
                success: function(){
                    self.page += 1;
                    //self.trigger('appendUsers', first)
                }
            });

            this.add(paginationCollection);

            return paginationCollection
        }
    });

    return UserCollection;
});