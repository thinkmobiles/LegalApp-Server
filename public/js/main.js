/**
 * Created by andrey on 16.07.15.
 */

var App = {};

require.config({
    paths: {
        jQuery          : './libs/jquery/dist/jquery',
        jQueryUI        : './libs/jqueryui/jquery-ui',
        Underscore      : './libs/underscore/underscore',
        Backbone        : './libs/backbone/backbone',
        less            : './libs/less/dist/less',
        socketio        : '/socket.io/socket.io',
        views           : './views',
        models          : './models',
        collections     : './collections',
        text            : './libs/text/text',
        templates       : '../templates'
    },
    shim: {
        'jQueryUI'      : ['jQuery'],
        'Backbone'      : ['Underscore', 'jQueryUI'],
        'app'           : ['Backbone','less']
    }
});

require(['app', 'socketio'], function(app, io){

    Backbone.View.prototype.errorNotification = function (xhr) {
        if (xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                if (xhr.status === 401) {
                    Backbone.history.navigate("login", { trigger: true });
                } else {
                    alert("You do not have permission to perform this action");
                }
            } else {
                if (xhr.responseJSON) {
                    alert(xhr.responseJSON.error);
                } else {
                    Backbone.history.navigate("users", { trigger: true });
                }
            }
        }
    };

    /*var socket = io.connect({
        transports: ['websocket']
    });


   /!* socket.on('welcome', function () {
        var model = App.sessionData;

        console.log('>>> welcome');
        socket.emit('authorize',{userId: model.get('userId'), permissions: model.get('role')});

    });*!/

    socket.on('newUser', function (user) {
        console.log('>>> newUser', user);
        App.Events.trigger('newUser', user);
    });*/

    app.initialize(io);
});