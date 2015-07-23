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
            "click #addInvite" : "inviteUser"
        },

        initialize: function () {

            this.render()
        },

        inviteUser: function (){
            var thisEL = this.$el;
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName = thisEL.find('#addLName').val().trim();
            var phone = thisEL.find('#addPhone').val().trim();
            var email = thisEL.find('#addEmail').val().trim();
            var permissions = thisEL.find("[selected = 'selected']").data('id');
            var company;

            var inviteData = {
                first_name : firstName,
                last_name  : lastName,
                phone      : phone,
                email      : email,
                permissions: permissions,
                company    : company
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

        render: function () {
            this.$el.html(_.template(AddUserTemplate));
            return this;
        }

    });
    return View;
});