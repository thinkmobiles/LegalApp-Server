'use strict';

define([
    'views/menu/topBarView',
    'collections/usersCollection'

], function (TopBarView, UsersCollection) {
    var events = {};

    App.events = events;

    _.extend(events, Backbone.Events);

    events.on('newUser', function (user) {
        console.log('>>> events.newUser');
        App.Collections.pendingCollection.add(user);
    });


});