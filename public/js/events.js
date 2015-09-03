'use strict';

define([
    'views/menu/topBarView',
    'collections/users'

], function (TopBarView, UsersCollection) {

    App.on('newUser', function (user) {
        console.log('>>> events.newUser');
    });



});