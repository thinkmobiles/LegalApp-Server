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

        events: {
            "click #addInvite" : "actionUser"
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

        inviteUser: function (){
            var thisEL = this.$el;
            var self   = this;
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName  = thisEL.find('#addLName').val().trim();
            var phone = thisEL.find('#addPhone').val().trim();
            var email = thisEL.find('#addEmail').val().trim();
            var permissions = thisEL.find("#addRole option:selected").data('id');

            var inviteData = {
                first_name  : firstName,
                last_name   : lastName,
                phone       : phone,
                email       : email,
                permissions : permissions
            };

            this.userModel = new UserModel();

            this.userModel.save(inviteData,{
                wait : true,
                success : function(){
                    alert('User invited successfully');
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
                    var co_s = response.toJSON();
                    self.$el.find('#tableNames').html(self.companyTemp(co_s));
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