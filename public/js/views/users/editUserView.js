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
            "click #editBtn" : "updateUser"
        },

        updateUser : function(){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#editFName').val().trim();
            var lastName = thisEL.find('#editLName').val().trim();
            var phone = thisEL.find('#editPhone').val().trim();
            var permissions = thisEL.find("#editRole option:selected").data('id');

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
                    self.remove();
                },
                error  : function(){
                    alert('Error'); // todo message
                }
            });
        },

        render: function () {
            var role = App.sessionData.get('role');
            var self = this;

            this.$el.html(_.template(EditTemp)({
                usrMdl : this.userModel.toJSON(),
                role   : role
            }))
                .dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "editCurrentUser",
                modal: true,
                width: "800px",
                close : function(){
                    self.remove()
                }
            });

            //this.$el.html(_.template(EditTemp)).dialog({
            //    closeOnEscape: false,
            //    autoOpen: true,
            //    dialogClass: "editCurrentUser",
            //    modal: true,
            //    width: "800px",
            //    close : function(){
            //        self.remove()
            //    }
            //});

            return this;
        }

    });

    return View;

});