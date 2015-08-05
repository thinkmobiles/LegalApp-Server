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
            "settings"              :  "settings",
            "settings/addTemplate"  :  "addTemplate",
            "settings/templates"    :  "templates",
            "documents"             :  "documents",
            "userProfile"           :  "userProfile",
            "forgotPassword"        :  "forgotPassword",
            "resetPassword/:token"  :  "resetPassword",
            "termsAndConditions"    :  "termsAndConditions",
            "confirmEmail(/:token)" :  "confirmEmail",
            "*any"                  :  "any"
        },

        initialize: function () {
                new TopMenuView();
        },

        loadWrapperView: function (argName, argParams, argRedirect) {
            var self = this;
            var name = argName;
            var nameView = name+'View';
            var params =  argParams;
            var redirect = argRedirect;
            var wrapper = $('#wrapper');

            if (redirect === REDIRECT.whenNOTAuthorized) {
                if (!App.sessionData.get('authorized')){
                    return Backbone.history.navigate("login", {trigger: true});
                }
            }

            if (redirect === REDIRECT.whenAuthorized) {
                if (App.sessionData.get('authorized')){
                    return Backbone.history.navigate("users", {trigger: true});
                }
            }

            require(['views/'+name+'/'+nameView], function (View) {
                self[nameView] = new View(params);

                if (self.wrapperView) {
                    self.wrapperView.undelegateEvents();
                    wrapper.html('');
                }

                wrapper.html(self[nameView].el);
                self[nameView].delegateEvents();

                this.wrapperView = self[nameView];

                if (self[nameView].afterRender) {
                    self[nameView].afterRender();
                }
            });
        },

        any: function () {
            Backbone.history.navigate("users", {trigger: true});
        },

        login: function () {
            this.loadWrapperView('login', null, REDIRECT.whenAuthorized);
        },

        signup: function () {
            this.loadWrapperView('signup', null, REDIRECT.whenAuthorized);
        },

        userProfile: function () {
            this.loadWrapperView('userProfile', null, REDIRECT.whenNOTAuthorized);
        },

        termsAndConditions: function () {
            this.loadWrapperView('termsAndConditions', null, null);
        },

        confirmEmail: function (token) {
            this.loadWrapperView('confirmEmail',{token : token}, REDIRECT.whenAuthorized);
        },

        forgotPassword: function () {
            this.loadWrapperView('forgotPassword', null, REDIRECT.whenAuthorized);
        },

        resetPassword: function (token) {
            this.loadWrapperView('resetPassword', {token : token}, REDIRECT.whenAuthorized);
        },

        users: function () {
            this.loadWrapperView('users', null, REDIRECT.whenNOTAuthorized);
        },

        documents: function () {
                this.loadWrapperView('documents', null, REDIRECT.whenNOTAuthorized);
        },

        addTemplate: function () {
            this.loadWrapperView('addTemplate', null, REDIRECT.whenNOTAuthorized);
        },

        templates: function () {
            this.loadWrapperView('templates', null, REDIRECT.whenNOTAuthorized);
        },

        settings: function () {
            this.loadWrapperView('settings', null, REDIRECT.whenNOTAuthorized);
        }

    });

    return appRouter;
});