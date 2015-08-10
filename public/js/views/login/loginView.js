/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/login/loginTemplate.html'

], function (LoginTemplate) {

    var View;
    View = Backbone.View.extend({

        id        :"loginDiv",

        typicalLogin : _.template(LoginTemplate),

        initialize: function (option) {
            this.token = option.token;

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
            var thisEl = this.$el;
            var data;
            var currentUrl = "/signIn";
            var errors = [];
            var messages = [];

            var stateModelUpdate = {
                errors     : false,
                messages   : false,
                password   : thisEl.find("#loginPass").val().trim(),
                rememberMe : thisEl.find('#rememberMe').prop('checked')
            };

            if (!this.token){
                stateModelUpdate.email = thisEl.find("#loginEmail").val().trim();
                data = {
                    email    : stateModelUpdate.email,
                    password : stateModelUpdate.password
                }
            } else {
                currentUrl += "/"+this.token;
                data = {
                    password : stateModelUpdate.password
                }
            }

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
            $.ajax({
                url      : currentUrl,
                type     : "POST",
                dataType : 'json',
                data     : data,
                success: function (res) {
                    var profile = res.user.profile;

                    $('#topMenu').show();
                    $('#leftMenu').show();
                    console.log(res);
                    App.sessionData.set({
                        authorized : true,
                        user       : profile.first_name+" "+profile.last_name,
                        role       : profile.permissions
                    });
                    App.router.navigate("users", {trigger: true});
                    self.stateModel.set({
                        password  : '',
                        errors    : false,
                        messages  : false,
                        email     : ''
                    });
                },
                error: function (err) {
                    App.sessionData.set({
                        authorized : false,
                        user       : null
                    });

                    self.stateModel.set({
                        errors     : [err.responseJSON.error],
                        password   : null
                    });
                }
            });

            return this;
        },

        render: function () {
            var this_el = this.$el;
            var isInvite = false;
            var tempModel = this.stateModel.toJSON();
            tempModel.isInvite = isInvite;

            if (this.token){
                isInvite = true;
                this_el.html(this.typicalLogin({isInvite : isInvite}));
            } else {
                this_el.html(this.typicalLogin(tempModel));
            }

            return this;
        }

    });

    return View;

});

