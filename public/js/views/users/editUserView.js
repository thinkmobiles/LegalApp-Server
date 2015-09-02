/**
 * Created by root on 19.08.15.
 */

define([
    'text!templates/users/editUserTemplate.html',
    'custom'

], function (EditTemp, custom) {

    var View;
    View = Backbone.View.extend({

        initialize: function (options) {
            this.userModel = options.userModel;

            this.render();
        },

        events : {
            "click #editBtn"       : "updateUser",
            "click #trueSignState" : "showOurSign"
        },

        //changeStatus: function(event){
        //    var theId = $(event.target).data('id');
        //    this.updateUser(theId);
        //},

        //saveUser: function(){
        //    this.updateUser();
        //},

        showOurSign: function (){
            var userId = this.userModel.get('id');
            var container = this.$el.find('#signInfoBox');
            var signInfo = container.find('#signInfo');
            /*var signBox = container.find('#signBox');*/

            $.ajax({
                url : 'url',
                success  : function (response){
                    signInfo.hide();
                    signInfo.after('<img id="currentSign" src="'+response+'">');
                },
                error    : function(){
                    alert('Error');
                }
            });
        },

        signatureLoad: function () {
            var inputFile = this.$el.find('#inputImg');

            inputFile.on('change', function (event) {
                event.preventDefault();

                var file = inputFile[0].files[0];
                var filesExt = 'docx';
                var parts = inputFile.val().split('.');

                if (filesExt === parts[parts.length - 1]) {
                    var fr = new FileReader();
                    fr.onload = function () {
                     //var result =fr.result;
                     // callback(file);
                     };
                    inputFile.val('');
                    fr.readAsDataURL(file);

                } else {
                    alert('Invalid file type!');
                }
            });
        },

        updateUser : function(){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#editFName').val().trim();
            var lastName = thisEL.find('#editLName').val().trim();
            //var phone = thisEL.find('#editPhone').val().trim();
            var permissions = thisEL.find("#editRole option:selected").data('id');
            var signing = thisEL.find('#editSign').prop('checked');
            var status = thisEL.find('#editStatus');
            var status_ch = status.prop('checked');
            var profile;

            this.signatureLoad(function(a){
                console.log(a);
            });

            profile = {
                first_name  : firstName,
                last_name      : lastName,
                //phone          : phone,
                permissions    : permissions,
                sign_authority : signing
            };

            var updateData = {
                profile : profile
            };

            if (status_ch){
                updateData.status = status.val();
            }

            this.userModel.save(updateData, {
                wait: true,
                success: function () {
                    alert('User updated successfully');
                    self.trigger('redirectList');
                    self.remove();
                },
                error  : function(model, xhr){
                    alert('Error'); // todo message
                    //self.errorNotification(xhr);
                }
            })
        },

        render: function () {
            var role = App.sessionData.get('role');

            this.$el.html(_.template(EditTemp)({
                usrMdl : this.userModel.toJSON(),
                role   : role
            }));

            //custom.canvasDraw(null, this);

            return this;
        }

    });

    return View;

});