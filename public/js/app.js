/**
 * Created by andrey on 16.07.15.
 */

define([
    'router',
    'communication',
    'custom'
], function (Router, Communication, Custom) {

    var initialize = function () {
        var appRouter;
        var events = {};

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

        App.Collections = {};
        App.Events = events;

        _.extend(events, Backbone.Events);

        events.on('newUser', function (user) {
            App.Collections.pendingCollection.add(user);
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