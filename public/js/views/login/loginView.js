/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/login/loginTemplate.html'
], function (LoginTemplate) {

    var View;
    View = Backbone.View.extend({

        id:"loginDiv",

        initialize: function () {
            this.setDefaultData();

            this.listenTo(this.stateModel, 'change', this.render);

            this.render();
        },

        events: {
            "click #loginButton"  : "login"
        },

        setDefaultData: function () {
            var defaultData = {
                rememberMe  :false,
                email       : '',
                password    : '',
                errors      : false,
                messages    : false
            };

            if (this.stateModel) {
                this.stateModel.set(defaultData);
            } else {
                this.stateModel = new Backbone.Model(defaultData);
            }
        },

        login: function (event) {
            event.stopImmediatePropagation();
            event.preventDefault();

            var self = this;
            var errors = [];
            var messages = [];

            var stateModelUpdate = {
                errors     : false,
                messages   : false,
                email      : this.$el.find("#loginEmail").val().trim(),
                password   : this.$el.find("#loginPass").val().trim(),
                rememberMe : this.$el.find('#rememberMe').prop('checked')
            };

            this.stateModel.set(stateModelUpdate);

            //validation.checkEmailField(messages, true, stateModelUpdate.email, 'Email');
            //validation.checkPasswordField(errObj, true, stateModelUpdate.password, 'Password');

            if (errors.length > 0 || messages.length > 0) {
                if (errors.length > 0) {
                    stateModelUpdate.errors = errors;
                }
                if (messages.length > 0) {
                    stateModelUpdate.messages = messages;
                }
                this.stateModel.set(stateModelUpdate);
                return this;
            }
            //$.ajax({
            //    url     : "/signIn",
            //    type    : "POST",
            //    dataType: 'json',
            //    data:{
            //        email     : stateModelUpdate.email,
            //        pass      : stateModelUpdate.password,
            //        rememberMe: stateModelUpdate.rememberMe
            //    },
            //    success: function (response) {
            //        App.sessionData.set({
            //            authorized : true,
            //            admin      : false,
            //            user       : response.user
            //        });
            //        App.router.navigate("main", {trigger: true});
            //        self.stateModel.set({
            //            password  : '',
            //            errors    : false,
            //            messages  : false,
            //            email     : ''
            //        });
            //    },
            //    error: function (err) {
            //        App.sessionData.set({
            //            authorized : false,
            //            admin      : false,
            //            user       : null
            //        });
            //
            //        self.stateModel.set({
            //            errors     : [err.responseJSON.error],
            //            password   : null
            //        });
            //    }
            //});

            //=====================================
            $('#topMenu').show();
            $('#leftMenu').show();
            App.router.navigate("users", {trigger: true});
            //=====================================


            return this;
        },

        render: function () {
            this.$el.html(_.template(LoginTemplate, this.stateModel.toJSON()));
            return this;
        }

    });

    return View;

});

