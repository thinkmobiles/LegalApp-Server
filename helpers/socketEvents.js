'use strict';

var socketEvents = function (io) {


    io.on('connection', function( socket ) {
        console.log('>>> user connected to socket');

        socket.on('authorize', function (data) {
            console.log('>>> socket.io authorize');
            console.log(data);
        });
    });


};

module.exports = socketEvents;
