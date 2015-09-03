var redis = require('redis');

function onError( err ) {
    "use strict";
    if ( err ) {
        return console.log( err.message || err );
    }
}

var Io = function ( server ) {
    "use strict";

    var adapter = require('socket.io-redis');
    var pub = redis.createClient(
        parseInt( process.env.REDIS_PORT ),
        process.env.REDIS_HOST,
        {
            return_buffers: true
        }
    );
    var sub = redis.createClient(
        parseInt( process.env.REDIS_PORT ),
        process.env.REDIS_HOST,
        {
            return_buffers: true
        }
    );

    var io = require('socket.io')(
        server,
        {
            transports: ['websocket']
        }
    );

    pub.select( parseInt( process.env.REDIS_DB_KEY ) );
    sub.select( parseInt( process.env.REDIS_DB_KEY ) );

    io.adapter(
        adapter({
            pubClient: pub,
            subClient: sub
        })
    );

    pub.on('error', onError );
    sub.on('error', onError );

    return io;
};

module.exports = Io;