/**
 * Created by Andrey on 21.09.2015.
 */

define([
    //'models/linkModel'
], function () {
    var MessagesCollection = Backbone.Collection.extend({
        //model: LinkModel,

        isAdmin     : false,

        url: function () {
            return this.isAdmin ? "/messages" : "currentUser/messages"
        },

        initialize: function(options){
            var currentType;

            if (options && options.isAdmin){
                this.isAdmin = true;
            }

            if (options && options.currentType){
                currentType = options.currentType;
            }

            if (currentType === 'helpMe' || currentType === 'contactUs') {
                this.fetch({
                    data : {type : currentType},
                    reset: true
                });
            }
        }
    });

    return MessagesCollection;
});