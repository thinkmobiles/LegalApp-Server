/**
 * Created by andrey on 23.07.15.
 */

define([
    'models/userModel'
], function (UserModel) {
    var UserCollection = Backbone.Collection.extend({
        model: UserModel,

        url: function () {
            return "/users"
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

    return UserCollection;
});