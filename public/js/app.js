/**
 * Created by andrey on 16.07.15.
 */

define([
    'router',
    'communication',
    'custom'
], function (Router, Communication, Custom) {

    var initialize = function (socketio) {
        var appRouter;
        var events;
        var socket = socketio.connect({
            transports: ['websocket']
        });

        socket.on('newUser', function (user) {
            //console.log('>>> newUser', user);
            App.Events.trigger('newUser', user);
        });

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
        App.Events = _.extend({}, Backbone.Events);

        events = App.Events;

        events.on('authorized', function () {
            var sessionData = App.sessionData;
            var socketAuth = {
                userId     : sessionData.get('userId'),
                permissions: sessionData.get('permissions')
            };

            socket.emit('authorize', socketAuth);
        });

        events.on('logout', function () {
            var sessionData = App.sessionData;
            var socketAuth = {
                userId     : sessionData.get('userId'),
                permissions: sessionData.get('permissions')
            };

            socket.emit('logout', socketAuth);
        });

        events.on('newUser', function (user) {
            var count;

            if (window.location.hash === '#newUsers') {
                App.Collections.pendingCollection.add(user);
            } else {
                count = App.Badge.get('pendingUsers');
                count++;
                App.Badge.set('pendingUsers', count);
            }
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