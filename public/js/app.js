/**
 * Created by andrey on 16.07.15.
 */

define([
    'router',
    'communication',
    'events',
    'custom'
], function (Router, Communication, Events, Custom) {

    var initialize = function () {
        var appRouter;

        App.sessionData = new Backbone.Model({
            authorized  : false,
            user        : null,
            role        : null,
            company     : null
        });

        App.Badge = new Backbone.Model({
            pendingUsers:  0,
            notifications: 0
        });

        appRouter = new Router();
        App.router = appRouter;

        Backbone.history.start({silent: true});

        Communication.checkLogin(function(err, data){
            Custom.runApplication(err, data);
        });

    };
    return {
        initialize: initialize
    }
});