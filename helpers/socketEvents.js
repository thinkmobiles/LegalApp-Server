'use strict';

var socketEvents = function (io) {


    io.on('connection', function( socket ) {
        console.log('>>>user connected to socket');

        socket.on('authorize', function (data) {
            console.log('>>> authorize');
            console.log(data);
        });

        //socket.emit('newUser', {user: 'foo'});
    });


};

module.exports = socketEvents;
