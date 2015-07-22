/**
 * Created by andrey on 16.07.15.
 */

define([
    'views/menu/topBarView',
    'constants/redirect'
], function (TopMenuView , REDIRECT) {

    var appRouter;
    appRouter = Backbone.Router.extend({

        wrapperView : null,
        topBarView  : null,
        view        : null,

        routes: {
            "login"                 :  "login",
            "signup"                :  "signup",
            "users"                 :  "users",
            "userProfile"           :  "userProfile",
            "forgotPassword"        :  "forgotPassword",
            "termsAndConditions"    :  "termsAndConditions",
            "confirmEmail(/:token)" :  "confirmEmail",
            "*any"                  :  "any"
        },

        initialize: function () {
                new TopMenuView();
        },

        loadWrapperView: function (name, params, redirect) {
            var self = this;

            if (redirect === REDIRECT.whenAuthorized) {
                if (!App.sessionData.get('authorized')){
                    return Backbone.history.navigate("login", {trigger: true});
                }
            }

            if (redirect === REDIRECT.whenNOTAuthorized) {
                if (App.sessionData.get('authorized')){
                    return Backbone.history.navigate("users", {trigger: true});
                }
            }

            require(['views/'+name+'/'+name+'View'], function (View) {
                if (!self[name+'View']) {
                    self[name+'View'] = new View();
                }
                self.changeWrapperView(self[name+'View'], params);
            });
        },

        changeWrapperView: function (wrapperView, params) {
            var wrap = $('#wrapper');

            if (this.wrapperView) {
                this.wrapperView.undelegateEvents();
                wrap.html('');
            }

            wrap.html(wrapperView.el);
            wrapperView.delegateEvents();

            this.wrapperView = wrapperView;

            if (wrapperView.afterRender) {
                wrapperView.afterRender();
            }

            if (wrapperView.setParams) {
                wrapperView.setParams(params);
            }
        },

        any: function () {
            this.loadWrapperView('users');
        },

        login: function () {
            this.loadWrapperView('login', null, REDIRECT.whenNOTAuthorized);
        },

        signup: function () {
            this.loadWrapperView('signup', null, REDIRECT.whenNOTAuthorized);
        },

        userProfile: function () {
            this.loadWrapperView('userProfile', null, REDIRECT.whenAuthorized);
        },

        termsAndConditions: function () {
            this.loadWrapperView('termsAndConditions', null, null);
        },

        confirmEmail: function (token) {
            this.loadWrapperView('confirmEmail',{token : token}, REDIRECT.whenNOTAuthorized);
        },

        forgotPassword: function () {
            this.loadWrapperView('forgotPassword', null, REDIRECT.whenNOTAuthorized);
        },

        users: function () {
            this.loadWrapperView('users', null, REDIRECT.whenAuthorized);
        }


    });

    return appRouter;
});