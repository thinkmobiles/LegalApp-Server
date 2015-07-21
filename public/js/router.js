/**
 * Created by andrey on 16.07.15.
 */

define([
    'views/menu/topBarView'
], function (TopMenuView) {

    var appRouter;
    appRouter = Backbone.Router.extend({

        wrapperView: null,
        topBarView : null,
        view       : null,

        routes: {
            "login"                 :  "login",
            "signup"                :  "signup",
            "users"                 :  "users",
            "termsAndConditions"    :  "termsAndConditions",
            "confirmEmail(/:token)" :  "confirmEmail",
            "*any"                  :  "any"
        },

        needAuthorize: [
            "users"
        ],

        redirectWhenAuthorize: [
            'login',
            'signup',
            'forgotPassword',
            'resetPassword',
            'confirmEmail'
        ],

        initialize: function () {
                new TopMenuView();
        },

        loadWrapperView: function (name, params) {
            var self = this;
            var i, arrLength;

            if (!App.sessionData.get('authorized')) {
                arrLength = this.needAuthorize.length;
                for (i=0; i<arrLength; i+=1){
                    if (name === this.needAuthorize[i]){
                        return Backbone.history.navigate("login", {trigger: true});
                    }
                }
            } else {
                arrLength = this.redirectWhenAuthorize.length;
                for (i=0; i<arrLength; i+=1){
                    if (name === this.redirectWhenAuthorize[i]){
                        return Backbone.history.navigate("users", {trigger: true});
                    }
                }
            }

            require(['views/' + name + '/' + name + 'View'], function (View) {
                if (!self[name + 'View']) {
                    self[name + 'View'] = new View();
                }
                self.changeWrapperView(self[name + 'View'], params);
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
            this.loadWrapperView('login');
        },

        signup: function () {
            this.loadWrapperView('signup');
        },

        termsAndConditions: function () {
            this.loadWrapperView('termsAndConditions');
        },

        confirmEmail: function (token) {
            this.loadWrapperView('confirmEmail',{token : token});
        },

        users: function () {
            this.loadWrapperView('users');
        }


    });

    return appRouter;
});