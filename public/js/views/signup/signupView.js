/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/signup/signupTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({
        initialize: function () {

            this.setDefaultData();

            this.listenTo(this.stateModel, 'change:errors change:messages', this.render);

            this.render();
        },


        events: {
            "click #signupButton" : "signUp"
        },

        setDefaultData: function () {
            var defaultData = {
                email             : '',
                password          : '',
                firstName         : '',
                lastName          : '',
                iAcceptConditions : false,
                errors            : false,
                messages          : false
            };
            if (this.stateModel) {
                this.stateModel.set(defaultData);
            } else {
                this.stateModel = new Backbone.Model(defaultData);
            }
        },

        afterRender: function () {
            this.setDefaultData();
            this.render();
        },

        signUp: function (event) {
            event.preventDefault();

            var self = this;
            var thisEl = this.$el;
            var email  = thisEl.find("#signupEmail").val().trim();
            var firstName = thisEl.find("#signupFName").val().trim();
            var lastName  = thisEl.find("#signupLName").val().trim();
            var password  = thisEl.find("#signupPass").val().trim();
            var confPassword = thisEl.find("#signupConfPass").val().trim();
            var company = thisEl.find("#signupCompany").val().trim();
            var iAcceptConditions = thisEl.find("#iAgree").prop('checked');
            //var errors = [];
            //var messages = [];

            var stateModelUpdate = {
                errors        : false,
                messages      : false,
                email         : email,
                firstName     : firstName,
                lastName      : lastName,
                password      : password,
                company       : company,
                iAcceptConditions: iAcceptConditions
            };


            this.stateModel.set(stateModelUpdate);

            //if (!stateModelUpdate.email || !validation.validEmail(stateModelUpdate.email)) {
            //    errObj.email.push('Password is not equal to confirm password');
            //}
            //
            //validation.checkNameField(errObj, true, stateModelUpdate.firstName, 'firstName');
            //validation.checkNameField(errObj, true, stateModelUpdate.lastName, 'lastName');
            //validation.checkPasswordField(errObj, true, stateModelUpdate.password, 'password');
            //validation.checkPasswordField(errObj, true, stateModelUpdate.confirmPassword, 'confirmPassword');
            //
            //if (stateModelUpdate.password !== stateModelUpdate.confirmPassword) {
            //    errObj.confirmPassword.push('Password is not equal to confirm password');
            //}
            //
            //if (!stateModelUpdate.iAcceptConditions) {
            //    errObj.condAndTerm.push('Terms and conditions is not checked');
            //}
            //
            //if (!captchaData || captchaData.response === '') {
            //    errObj.captcha.push('please check reCAPTCHA');
            //}
            //
            //
            //for (var my in errObj){
            //    errCount += errObj[my].length;
            //}
            //
            //if (errors.length > 0 || messages.length > 0 || errCount>0) {
            //    if (errors.length > 0) {
            //        stateModelUpdate.errors = errors;
            //    }
            //    if (messages.length > 0) {
            //        stateModelUpdate.messages = messages;
            //    }
            //    if (errCount > 0) {
            //        stateModelUpdate.errObj = errObj;
            //    }
            //    this.stateModel.set(stateModelUpdate);
            //    return this;
            //}
            $.ajax({
                url  : "/signUp",
                type : "POST",
                data : {
                    email         : stateModelUpdate.email,
                    password      : stateModelUpdate.password,
                    first_name    : stateModelUpdate.firstName,
                    last_name     : stateModelUpdate.lastName,
                    company       : stateModelUpdate.company
                },
                success: function () {
                    self.stateModel.set({
                        password      : '',
                        email         : '',
                        firstName     : '',
                        lastName      : '',
                        company       : '',
                        iAcceptConditions: false
                    });

                    App.router.navigate("confirmEmail", {trigger: true});
                },
                error: function (err) {
                    //App.error(err);
                    self.stateModel.set({
                        errors     : [err.responseJSON.error],
                        password   : null
                    });

                }
            });
            return this;
        },

        render: function () {
            this.$el.html(_.template(template, this.stateModel.toJSON()));

            return this;
        }
    });

    return View;

});
