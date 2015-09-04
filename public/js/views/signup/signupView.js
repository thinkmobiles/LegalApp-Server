/**
 * Created by andrey on 17.07.15.
 */

define([
    'text!templates/signup/signupTemplate.html'
], function (template) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

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
                firstName         : '',
                lastName          : '',
                //iAcceptConditions : false,
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
            var company = thisEl.find("#signupCompany").val().trim();
            var iAcceptConditions = thisEl.find("#iAgree").prop('checked');

            var stateModelUpdate = {
                errors        : false,
                messages      : false,
                email         : email,
                firstName     : firstName,
                lastName      : lastName,
                company       : company
                //iAcceptConditions: iAcceptConditions
            };

            this.stateModel.set(stateModelUpdate);

            if (iAcceptConditions) {
                $.ajax({
                    url: "/signUp",
                    type: "POST",
                    data: {
                        email: stateModelUpdate.email,
                        first_name: stateModelUpdate.firstName,
                        last_name: stateModelUpdate.lastName,
                        company: stateModelUpdate.company
                    },
                    success: function () {
                        self.stateModel.set({
                            email: '',
                            firstName: '',
                            lastName: '',
                            company: ''
                            //iAcceptConditions: false
                        });

                        App.router.navigate("confirmEmail", {trigger: true});
                    },
                    error: function (err) {
                        alert('Error');
                        //self.stateModel.set({
                        //    errors     : [err.responseJSON.error],
                        //});

                    }
                });
            } else {
                alert('You mast agree with "Terms of Service"');
            }
            return this;
        },

        render: function () {
            this.$el.html(_.template(template, this.stateModel.toJSON()));

            return this;
        }
    });

    return View;

});
