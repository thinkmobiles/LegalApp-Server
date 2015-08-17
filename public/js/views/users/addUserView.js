/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/addUserTemplate.html',
    'text!templates/forSelect/companyNamesTemplate.html',
    'models/userModel'

], function (AddUserTemplate, CompanyName, UserModel) {

    var View;

    View = Backbone.View.extend({

        //el : '#addUserContainer',
        companyTemp : _.template(CompanyName),

        currentState : 0,

        events: {
            "click #addInvite"     : "actionUser",
            "click .selThisComp"   : "selectCurrentCompany",
            "click #goSaveCompany" : "goSaveCompany"
        },

        initialize: function (options) {

            this.editThisForm = false;
            if (options){
                if (options.userModel) {
                    this.editThisForm = true;
                    this.userModel = options.userModel;
                }
            }

            this.render();
        },

        selectCurrentCompany: function(event){
            var target = $(event.target);
            var comId = target.data('id');
            var comName = target.text().trim();
            var resultField = this.$el.find('#selectedCompany');

            resultField.text(comName);
            resultField.attr('data-id', comId);
        },

        goSaveCompany: function(){
            var self = this;
            var this_el = this.$el;
            var newCompany = this_el.find('#newCompName').val().trim();
            var resultField = this_el.find('#selectedCompany');

            $.ajax({
                url : '/companies',
                type : 'POST',
                data : {name : newCompany},
                success : function(response){
                    var model = response.model;
                    resultField.text(model.name);
                    resultField.attr('data-id', model.id);
                    self.renderCompanies();
                },
                error   : function(){}
            });
        },

        //cleanFormOldInfo: function (){
        //    var thisEL = this.$el;
        //    var firstName = thisEL.find('#addFName').val('');
        //    var lastName  = thisEL.find('#addLName').val('');
        //    var phone = thisEL.find('#addPhone').val('');
        //    var email = thisEL.find('#addEmail').val('');
        //},

        inviteUser: function (){
            var thisEL = this.$el;
            var self   = this;
            var firstName = thisEL.find('#addFName');
            var lastName  = thisEL.find('#addLName');
            var phone = thisEL.find('#addPhone');
            var email = thisEL.find('#addEmail');
            var permissions = thisEL.find("#addRole option:selected");
            var companyId = thisEL.find("#selectedCompany").attr('data-id');

            var inviteData = {
                first_name  : firstName.val().trim(),
                last_name   : lastName.val().trim(),
                phone       : phone.val().trim(),
                email       : email.val().trim(),
                permissions : permissions.data('id')
            };

            if (this.currentState === 1 && +companyId === 0){
                return alert("Enter, please, your client's company!");
            }

            if (this.currentState === 1) {
                inviteData.companyId = companyId;
            }

            this.userModel = new UserModel();

            this.userModel.save(inviteData,{
                wait : true,
                success : function(){
                    alert('User invited successfully');

                    firstName.val('');
                    lastName.val('');
                    phone.val('');
                    email.val('');

                    self.trigger('redirectList');
                },
                error : function(){
                    alert('Error'); // todo message
                }
            });
        },

        renderCompanies : function(){
            var self = this;

            $.ajax({
                url  : "/companies",
                type : "GET",

                success : function(response){
                    self.$el.find('#companyNames').html(self.companyTemp({coll : response}));
                }
            });
        },

        updateUser : function(){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName = thisEL.find('#addLName').val().trim();
            var phone = thisEL.find('#addPhone').val().trim();
            var permissions = thisEL.find("#addRole option:selected").data('id');

            var updateData = {
                profile : {
                    first_name  : firstName,
                    last_name   : lastName,
                    phone       : phone,
                    permissions : permissions
                }
            };

            this.userModel.save(updateData,{
                wait   : true,
                success: function(){
                    alert('User updated successfully');
                    self.trigger('redirectList');
                },
                error  : function(){
                    alert('Error'); // todo message
                }
            });

        },

        actionUser : function(){
            if (this.editThisForm){
                this.updateUser()
            } else {
                this.inviteUser()
            }
        },

        render: function () {
            var role = App.sessionData.get('role');

            if (!this.editThisForm) {
                this.$el.html(_.template(AddUserTemplate)({
                    edit   : false,
                    role   : role
                }));
            } else {
                this.$el.html(_.template(AddUserTemplate)({
                    edit   : true,
                    usrMdl : this.userModel.toJSON(),
                    role   : role
                }));
            }

            this.renderCompanies();

            return this;
        }

    });
    return View;
});