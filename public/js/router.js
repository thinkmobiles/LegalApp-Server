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
            "documents/:viewType"   :  "documents",
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

        loadWrapperView: function (argName, params, argRedirect, argViewType) {
            var self = this;
            var name = argName;
            var vt = '';
            var redirect = argRedirect;
            var viewType = argViewType;

            if (viewType){
                vt = viewType.charAt(0).toUpperCase()+viewType.slice(1)
            }

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

            require(['views/'+name+'/'+name+vt+'View'], function (View) {
                self[name+vt+'View'] = new View();

                self.changeWrapperView(self[name+vt+'View'], params);
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

        documents: function (viewType) {
                this.loadWrapperView('documents', null, REDIRECT.whenNOTAuthorized, viewType);
        },

        addTemplate: function () {
            this.loadWrapperView('addTemplate', null, REDIRECT.whenNOTAuthorized);
        },

        settings: function () {
            this.loadWrapperView('settings', null, REDIRECT.whenNOTAuthorized);
        }

    });

    return appRouter;
});