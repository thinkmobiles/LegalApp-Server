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
        currentPage : {},

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
                this.url = "/users/search";

                this.fetch({
                    data  : {status : options.status},
                    reset : true
                })
            }
        },

        showMore: function(argOptions) {
            var self = this;
            var options = argOptions;
            var first;
            var fetchOptions = {};
            var paginationCollection = new Backbone.Collection();

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

            paginationCollection.url = this.url();

            fetchOptions.page = self.page;
            fetchOptions.count = 50;

            paginationCollection.fetch({
                data   : fetchOptions,
                reset  : true,
                success: function(){
                    self.page += 1;
                    self.currentPage = paginationCollection.toJSON();
                    self.add(self.currentPage);
                    self.trigger('appendUsers', first)
                },
                error : function (){
                    alert('Some error');
                }
            });
        }
    });

    return UserCollection;
});