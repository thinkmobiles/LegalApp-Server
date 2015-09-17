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

            this.fetch({
                reset  : true,
                success: function(){
                    self.page += 1;
                    self.trigger('appendUsers', first)
                }
            });
        }
    });

    return UserCollection;
});