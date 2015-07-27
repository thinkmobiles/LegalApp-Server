/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/addUserTemplate.html',
    'models/userModel'

], function (AddUserTemplate, UserModel) {

    var View;

    View = Backbone.View.extend({

        id : 'addUserForm',

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
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName = thisEL.find('#addLName').val().trim();
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
                },
                error : function(){
                    alert('Error'); // todo message
                }
            });

        },

        updateUser : function(){
            var thisEL = this.$el;
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName = thisEL.find('#addLName').val().trim();
            var phone = thisEL.find('#addPhone').val().trim();
            var email = thisEL.find('#addEmail').val().trim();
            var permissions = thisEL.find("#addRole option:selected").data('id');

            var updateData = {
                profile : {
                    first_name : firstName,
                    last_name  : lastName
                },
                phone          : phone,
                email          : email,
                permissions    : permissions
            };

            //this.userModel = new UserModel({id : this.userID});

            this.userModel.save(updateData,{
                wait : true,
                success : function(){
                    alert('User updated successfully');
                },
                error : function(){
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
            if (!this.editThisForm) {
                this.$el.html(_.template(AddUserTemplate)({edit : false}));
            } else {
                this.$el.html(_.template(AddUserTemplate)({
                    edit   : true,
                    usrMdl : this.userModel.toJSON()
                }));
            }
            return this;
        }

    });
    return View;
});