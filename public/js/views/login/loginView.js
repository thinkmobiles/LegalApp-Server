/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/login/loginTemplate.html',
    'validation'

], function (LoginTemplate, validation) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        typicalLogin : _.template(LoginTemplate),

        initialize: function (option) {
            this.token = option.token;

            this.setDefaultData();
            this.listenTo(this.stateModel, 'change', this.render);

            this.render();
        },

        events: {
            "click #loginButton"        : "login",
            "focusin .form-field>input" : "clearField"
        },

        setDefaultData: function () {
            var defaultData = {
                rememberMe  : false,
                email       : '',
                password    : '',
                errorObject : false
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
            var errorObject = {};

            var stateModelUpdate = {
                errorObject: false,
                password   : thisEl.find("#loginPass").val().trim(),
                rememberMe : thisEl.find('#rememberMe').prop('checked')
            };

            if (!this.token){
                stateModelUpdate.email = thisEl.find("#loginEmail").val().trim();
                validation.checkEmailField(errorObject, stateModelUpdate.email, 'email');
                data = {
                    email      : stateModelUpdate.email,
                    password   : stateModelUpdate.password,
                    rememberMe : stateModelUpdate.rememberMe
                }
            } else {
                currentUrl += "/"+this.token;
                data = {
                    password   : stateModelUpdate.password,
                    rememberMe : stateModelUpdate.rememberMe
                }
            }

            validation.checkPasswordField(errorObject, stateModelUpdate.password, 'password');

            //this.stateModel.set(stateModelUpdate);

            if (errorObject.email || errorObject.password) {
                stateModelUpdate.errorObject = errorObject;
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
                    //console.log(res);
                    App.sessionData.set({
                        authorized : true,
                        user       : profile.first_name+" "+profile.last_name,
                        role       : profile.permissions,
                        company    : res.user.company[0].id
                    });
                    App.router.navigate("users", {trigger: true});
                    self.stateModel.set({
                        password    : '',
                        email       : '',
                        errorObject : false
                    });
                },
                error: function (err) {
                    App.sessionData.set({
                        authorized : false,
                        user       : null,
                        role       : null,
                        company    : null
                    });

                    self.stateModel.set({
                        //errors     : [err.responseJSON.error],
                        password   : null
                    });
                }
            });

            return this;
        },

        clearField: function(event){
            var targetContainer = $(event.target).closest('.form-field');
            targetContainer.find('input').removeClass('error_input');
            targetContainer.find('.error_msg').hide();
        },

        render: function () {
            var this_el = this.$el;
            //var isInvite = false;
            var tempModel = this.stateModel.toJSON();
            tempModel.isInvite = false;

            if (this.token) {
                tempModel.isInvite = true;
            }
            this_el.html(this.typicalLogin(tempModel));
                //this_el.html(this.typicalLogin({isInvite : isInvite}));
            //} else {
            //    this_el.html(this.typicalLogin(tempModel));
            //}

            return this;
        }

    });

    return View;

});

