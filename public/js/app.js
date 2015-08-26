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

        App.sessionData = new Backbone.Model({
            authorized  : false,
            user        : null,
            role        : null
        });

        App.templateInfo = new Backbone.Model();

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