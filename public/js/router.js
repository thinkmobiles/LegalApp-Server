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

        routes: {
            "login(/:token)"              :  "login",
            "signup"                      :  "signup",
            "users"                       :  "users",
            "settings"                    :  "settings",
            "newUsers"                    :  "newUsers",
            //"documents/inProgress/:id"    :  "docInProgress",
            ":docType/preview/:id"        :  "forPreview",
            "templates/:viewType"         :  "templates",
            "documents/:token/signature"  :  "signature",
            "documents/:viewType"         :  "documents",
            "taskList"                    :  "taskList",
            "userProfile"                 :  "userProfile",
            "forgotPassword"              :  "forgotPassword",
            "resetPassword/:token"        :  "resetPassword",
            //"termsAndConditions"          :  "termsAndConditions",
            "confirmEmail(/:token)"       :  "confirmEmail",
            "help"                        :  "help",
            "*any"                        :  "any"
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

        /*termsAndConditions: function () {
            this.loadWrapperView('termsAndConditions', null, null);
        },*/

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
            this.loadWrapperView('documents', {viewType : viewType}, REDIRECT.whenNOTAuthorized);
        },

        forPreview: function (docType, id){
            if (docType === 'templates' || docType === 'documents') {
                this.loadWrapperView('templatesPre', {docType: docType, id: id}, REDIRECT.whenNOTAuthorized);
            } else {
                Backbone.history.navigate("users", {trigger: true});
            }
        },

        templates: function (viewType) {
            this.loadWrapperView('templates', {viewType : viewType}, REDIRECT.whenNOTAuthorized);
        },

        settings: function () {
            this.loadWrapperView('settings', null, REDIRECT.whenNOTAuthorized);
        },

        //docInProgress: function(id){
        //    this.loadWrapperView('docInProgress', {id : id}, REDIRECT.whenNOTAuthorized);
        //},

        help: function(){
            this.loadWrapperView('help', null, REDIRECT.whenNOTAuthorized);
        },

        newUsers: function() {
            this.loadWrapperView('newUsers', null, REDIRECT.whenNOTAuthorized);
        }

    });

    return appRouter;
});