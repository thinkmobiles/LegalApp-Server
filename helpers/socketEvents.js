'use strict';

var socketEvents = function (io) {


    io.on('connection', function( socket ) {
        console.log('>>>user connected to socket');
        /*socket.on('signUp', function(data){
            console.log('===C��������� ���� ������ signUp===������� ='+data);
        })*/

    });
};

module.exports = socketEvents;
