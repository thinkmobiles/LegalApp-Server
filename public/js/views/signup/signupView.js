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
