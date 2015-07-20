/**
 * Created by andrey on 16.07.15.
 */

define([],function () {
    var runApplication = function (err, data) {
        var url;
        url =  Backbone.history.fragment || Backbone.history.getFragment();

        if (url === "") {
            url = 'users';
        }

        if (Backbone.history.fragment) {
            Backbone.history.fragment = '';
        }

        if (!err) {
            App.sessionData.set('authorized',true);
            $('#topMenu').show();
            $('#leftMenu').show();
            return Backbone.history.navigate(url, {trigger: true});
        } else {
            App.sessionData.set('authorized',false);
            $('#topMenu').hide();
            $('#leftMenu').hide();
            return Backbone.history.navigate(url, {trigger: true});
        }

    };


    return {
        runApplication: runApplication
    };
});
