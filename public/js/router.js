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
            "login(/:token)"             :  "login",
            "signup"                     :  "signup",
            "users"                      :  "users",
            "settings"                   :  "settings",
            "templates/preview/:id"      :  "tempPre",
            "templates/:viewType"        :  "templates",
            "documents/:token/signature" :  "signature",
            "documents/:viewType"        :  "documents",
            "taskList"                   :  "taskList",
            "userProfile"                :  "userProfile",
            "forgotPassword"             :  "forgotPassword",
            "resetPassword/:token"       :  "resetPassword",
            "termsAndConditions"         :  "termsAndConditions",
            "confirmEmail(/:token)"      :  "confirmEmail",
            "help"                       :  "help",
            "*any"                       :  "any"
        },

        initialize: function () {
                new TopMenuView();
        },

        loadWrapperView: function (argName, argParams, argRedirect, argViewType) {
            var self = this;
            var name = argName;
            var nameView = name+'View';
            var params =  argParams;
            var redirect = argRedirect;
            var viewType;
            //var wrapper = $('#wrapper');

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

            if (argViewType){
                viewType = argViewType[0].toUpperCase()+argViewType.slice(1);
                nameView = name+viewType+'View';
            }

            require(['views/'+name+'/'+nameView], function (View) {
                self[nameView] = new View(params);

                if (self.wrapperView) {
                    self.wrapperView.undelegateEvents();
                }

                self.wrapperView = self[nameView];

                if (self.wrapperView.afterRender) {
                    self.wrapperView.afterRender();
                }
            });
        },

        any: function () {
            Backbone.history.navigate("users", {trigger: true});
        },

        login: function (token) {
            this.loadWrapperView('login', {token : token}, REDIRECT.whenAuthorized);
        },

        signup: function () {
            this.loadWrapperView('signup', null, REDIRECT.whenAuthorized);
        },

        userProfile: function () {
            this.loadWrapperView('userProfile', null, REDIRECT.whenNOTAuthorized);
        },

        signature : function (token) {
            this.loadWrapperView('signature', {token : token}, REDIRECT.whenNOTAuthorized);
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

        taskList : function (){
            this.loadWrapperView('taskList', null, REDIRECT.whenNOTAuthorized);
        },

        documents: function (viewType) {
            this.loadWrapperView('documents', null, REDIRECT.whenNOTAuthorized, viewType);
        },

        tempPre: function (id){
            this.loadWrapperView('tempPre', {id : id}, REDIRECT.whenNOTAuthorized);
        },

        templates: function (viewType) {
            this.loadWrapperView('templates', null, REDIRECT.whenNOTAuthorized, viewType);
        },

        settings: function () {
            this.loadWrapperView('settings', null, REDIRECT.whenNOTAuthorized);
        },

        help: function(){
            this.loadWrapperView('help', null, REDIRECT.whenNOTAuthorized);
        }

    });

    return appRouter;
});