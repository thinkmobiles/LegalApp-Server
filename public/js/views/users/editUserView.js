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

            this.listenTo(this.userModel, 'change:sign_image', this.showOurSign);

            this.render();
        },

        events : {
            "click #editBtn"       : "updateUser",
            "click .trueSignState" : "showOurSign",
            "click #currentSign"   : "deleteSign"

        },

        showOurSign: function(){
            var sign = this.userModel.get('sign_image');

            if (sign !== null) {
                this.drawSign(sign);
            }
        },

        drawSign: function (argsSign){
            var sign = argsSign;
            var userId = this.userModel.get('id');
            var container = this.$el.find('#signInfoBox');
            var signInfo = container.find('#signInfo');
            var signBox = container.find('#signBox');

            if (sign){
                signInfo.hide();
                signBox.html('<img id="currentSign" src="'+sign+'">');
            } else {
                $.ajax({
                    url : 'users/'+userId+'/signature',
                    success  : function (response){
                        var result = response.signImage;
                        signInfo.hide();
                        signBox.html('<img id="currentSign" src="'+result+'">');
                    },
                    error    : function(){
                        alert('Error');
                    }
                });
            }
        },

        deleteSign: function(){
            var container = this.$el.find('#signInfoBox');
            var signInfo = container.find('#signInfo');
            var signBox = container.find('#signBox');

            signInfo.show();
            signBox.html('');
            this.userModel.set('sign_image', null);
        },

        changeDataInRow: function(){
            var rowTarget = $('.activeRow');
            var profileInfo = this.userModel.get('profile');
            var fName = profileInfo.first_name;
            var lName = profileInfo.last_name;
            var permission = profileInfo.permissions % 10;
            var signAuth = profileInfo.sign_authority;
            var permVal;

            switch (permission){
                case 1: permVal = 'Admin';
                    break;
                case 2: permVal = 'Editor';
                    break;
                default : permVal = 'Viewer';
            }

            rowTarget.find('.rName').text(fName+' '+lName);
            rowTarget.find('.rRole').text(permVal);
            rowTarget.find('.rCheck>input').prop('checked',signAuth);
            rowTarget.find('.rDisk').text((permission === 3) ? 'Can view but not edit' : '');

            rowTarget.removeClass('activeRow');
            this.remove()
        },

        updateUser : function(){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#editFName').val().trim();
            var lastName = thisEL.find('#editLName').val().trim();
            var permissions = thisEL.find("#editRole option:selected").data('id');
            var signing = thisEL.find('#editSign').prop('checked');
            var status = thisEL.find('#editStatus');
            var status_ch = status.prop('checked');
            var profile;

            profile = {
                first_name  : firstName,
                last_name      : lastName,
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
                    self.changeDataInRow();
                    self.remove();
                },
                error  : function(model, xhr){
                    alert('Error'); // todo message
                    //self.errorNotification(xhr);
                }
            })
        },

        render: function () {
            var self = this;
            var role = App.sessionData.get('role');

            this.$el.html(_.template(EditTemp)({
                usrMdl : this.userModel.toJSON(),
                role   : role
            }));

            custom.signatureLoad(this, function(resultSignature){
                self.userModel.set('sign_image', resultSignature);
            });

            return this;
        }

    });

    return View;

});