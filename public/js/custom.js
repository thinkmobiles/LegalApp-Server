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
            App.sessionData.set({
                authorized : true,
                user       : data.profile.first_name+' '+data.profile.last_name,
                role       : data.profile.permissions
            });
            $('#topMenu').show();
            $('#leftMenu').show();
            return Backbone.history.navigate(url, {trigger: true});
        } else {
            App.sessionData.set({
                authorized : false,
                user       : null
            });
            $('#topMenu').hide();
            $('#leftMenu').hide();
            return Backbone.history.navigate(url, {trigger: true});
        }

    };


    return {
        runApplication: runApplication
    };
});
