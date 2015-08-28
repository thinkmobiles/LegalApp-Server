/**
 * Created by root on 19.08.15.
 */

define([
    'text!templates/users/editUserTemplate.html'

], function (EditTemp) {

    var View;
    View = Backbone.View.extend({

        initialize: function (options) {
            this.userModel = options.userModel;

            this.render();
        },

        events : {
            "click #editBtn"    : "saveUser",
            "click #editStatus" : "changeStatus"
        },

        changeStatus: function(event){
            var theId = $(event.target).data('id');
            this.updateUser(theId);
        },

        saveUser: function(){
            this.updateUser();
        },

        updateUser : function(statusId){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#editFName').val().trim();
            var lastName = thisEL.find('#editLName').val().trim();
            var phone = thisEL.find('#editPhone').val().trim();
            var permissions = thisEL.find("#editRole option:selected").data('id');
            var signing = thisEL.find('#editSign').prop('checked');
            var status;
            var profile;

            profile = {
                first_name  : firstName,
                last_name      : lastName,
                phone          : phone,
                permissions    : permissions,
                sign_authority : signing
            };

            var updateData = {
                profile : profile
            };

            if (statusId !== undefined){
                updateData.status = statusId;
            }

            this.userModel.save(updateData,{
                wait   : true,
                success: function(){
                    alert('User updated successfully');
                    self.trigger('redirectList');
                    self.remove();
                },
                error  : function(model, xhr, options){
                    alert('Error'); // todo message
                    //self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var role = App.sessionData.get('role');

            this.$el.html(_.template(EditTemp)({
                usrMdl : this.userModel.toJSON(),
                role   : role
            }));

            return this;
        }

    });

    return View;

});