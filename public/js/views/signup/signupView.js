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
            "click #signupButton"     : "signUp"
            //"focusin .form-control" : "clearField",
            //"click #captcha"        : "clearField",
            //"click .customCheckbox" : "clearField"
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
            //var errors = [];
            //var messages = [];

            var stateModelUpdate = {
                errors        : false,
                messages      : false,
                email         : this.$el.find("#signupEmail").val().trim(),
                firstName     : this.$el.find("#signupFName").val().trim(),
                lastName      : this.$el.find("#signupLName").val().trim(),
                password      : this.$el.find("#signupPass").val().trim(),
                iAcceptConditions: this.$el.find("#iAgree").prop('checked')
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
                    email     : stateModelUpdate.email,
                    pass      : stateModelUpdate.password,
                    firstName : stateModelUpdate.firstName,
                    lastName  : stateModelUpdate.lastName
                },
                success: function () {
                    self.stateModel.set({
                        password      : '',
                        email         : '',
                        firstName     : '',
                        lastName      : '',
                        iAcceptConditions: false
                    });

                    //App.router.navigate("confirm", {trigger: true});
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
