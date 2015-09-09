/**
 * Created by root on 19.08.15.
 */

define([
    'text!templates/users/editUserTemplate.html',
    'custom'

], function (EditTemp, custom) {

    var View;
    View = Backbone.View.extend({

        tagName: 'tr',
        className : 'editUserRow',

        initialize: function (options) {
            //var usId = options.userId;
            //this.userCollection = options.userColl;

            this.userModel = options.userModel;
            //this.userModel = this.userCollection.get(usId);

            this.listenTo(this.userModel, 'change:sign_image', this.showOurSign);
            this.listenTo(this.userModel, 'sync', this.changeDataInRow);

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
                signBox.html('<img id="currentSign" src="'+sign+'"><a href="#" id="closeIco">x</a>');
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

            signInfo.find('img').switchClass('trueSignState', 'falseSignState');
            signInfo.show();
            signBox.html('');
            this.userModel.set('sign_image', null);
        },

        changeDataInRow: function(){
            var rowTarget = $('.activeRow');
            var profileInfo = this.userModel.get('profile');
            var status = this.userModel.get('status');
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
            if (+status){
                rowTarget.removeClass('notActiv');
            } else {
                rowTarget.addClass('notActiv');
            }
            this.remove()
        },

        updateUser : function(){
            var self = this;
            var thisEL = this.$el;
            var firstName = thisEL.find('#editFName').val().trim();
            var lastName = thisEL.find('#editLName').val().trim();
            var permissions = thisEL.find(".addRole").data('id');
            var signing = thisEL.find('#editSign').prop('checked');
            var status = thisEL.find('#editStatus');
            var status_ch = status.prop('checked');
            var profile;

            profile = {
                first_name     : firstName,
                last_name      : lastName,
                permissions    : permissions,
                sign_authority : signing
            };

            var updateData = {
                profile    : profile
                //sign_image : self.userModel.get('sign_image')
            };

            if (status_ch){
                updateData.status = +status.val();
            }

            this.userModel.save(updateData,{
                wait: true
            });
        },

        render: function () {
            var self = this;
            var role = App.sessionData.get('permissions');

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