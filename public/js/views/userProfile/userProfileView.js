/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/userProfile/userProfileTemplate.html',
    'validation',
    'custom'
], function (UsrProfTemp, Validation, custom) {

    var View;
    View = Backbone.View.extend({

        el: '#wrapper',

        initialize: function () {
            this.currentModel = new Backbone.Model({
                firstName: '',
                lastName : '',
                phone    : '',
                company  : ''
            });

            this.listenTo(this.currentModel, "change", this.render);

            this.getUserData();
        },

        events: {
            "click #profSaveBut"  : "saveProfile",
            "click .trueSignState": "showOurSign",
            "click #closeIco"     : "deleteSign",
            "click .signImage"    : "uploadSignature",
            'change .upload'      : 'changeSignature'
        },

        getUserData: function () {
            var self = this;

            $.ajax({
                url : "/currentUser",
                type: "GET",

                success: function (response) {
                    self.currentModel.set({
                        firstName     : response.profile.first_name,
                        lastName      : response.profile.last_name,
                        phone         : response.profile.phone,
                        company       : response.company[0].name,
                        sign_authority: response.profile.sign_authority
                    });
                },
                error  : function (err) {
                    self.errorNotification(err)
                }
            });
        },

        letsDrawCanvas: function () {
            var self = this;

            $.ajax({
                url    : "/getAvatar",
                success: function (response) {
                    custom.canvasDraw({imageSrc: response}, self);
                },
                error  : function () {
                    custom.canvasDraw(null, self);
                }
            });

        },

        saveProfile: function () {
            var self = this;
            var this_el = self.$el;
            var profNameFirst = this_el.find('#profFName').val().trim();
            var profNameLast = this_el.find('#profLName').val().trim();
            var profPhone = this_el.find('#profPhone').val().trim();
            var photoInput = this_el.find('#inputImg')[0].files.length;
            var signatureInput = this_el.find('.upload')[0].files.length;
            var newPass = this_el.find('#profPass').val().trim();
            var imageSRC;
            var signatureSRC;
            var saveData = {};
            var pass;
            var confirmPass;
            var mailAlert;

            if (!profNameFirst || !profNameLast) {
                return alert('First name and last name fields can not be empty'); // todo correct message
            }

            saveData.profile = {
                first_name: _.escape(profNameFirst),
                last_name : _.escape(profNameLast),
                phone     : _.escape(profPhone)
            };

            if (newPass) {
                pass = this_el.find('#profCurPass').val().trim();
                confirmPass = this_el.find('#profConfPass').val().trim();
                mailAlert = Validation.checkPasswordField({}, newPass, 'Password');

                if (mailAlert) {
                    this_el.find('#profPass').val('');
                    this_el.find('#profConfPass').val('');
                    return alert(mailAlert);
                }

                if (newPass === confirmPass) {
                    saveData.password = pass;
                    saveData.newPassword = newPass;
                } else {
                    return alert('Please confirm password');
                }
            }

            if (photoInput) {
                imageSRC = this_el.find('#avatar')[0].toDataURL('image/jpeg');
                saveData.imageSrc = imageSRC;
            }

            if (signatureInput) {
                signatureSRC = this_el.find('.signImage').attr('src');
                saveData.sign_image = signatureSRC;
            }

            $.ajax({
                url        : "/profile",
                type       : "PUT",
                contentType: "application/json; charset=utf-8",
                dataType   : "json",
                data       : JSON.stringify(saveData),

                success: function (response) {
                    var userInfo = response.user;
                    var avatar = userInfo.avatar.url;
                    var fName = userInfo.profile.first_name;
                    var lName = userInfo.profile.last_name;

                    $('#topBarLogo').attr('src', imageSRC);
                    alert('Profile updated successfully');

                    App.sessionData.set({
                        avatar    : avatar,
                        first_name: fName,
                        last_name : lName
                    });
                    Backbone.history.navigate("users", {trigger: true});
                },
                error  : function (err) {
                    self.errorNotification(err)
                }
            });
        },

        render: function () {
            var tempData = this.currentModel.toJSON();

            this.$el.html(_.template(UsrProfTemp)(tempData));

            this.letsDrawCanvas();

            return this;
        },

        showOurSign: function () {
            var userId = App.sessionData.get('userId');
            var url = '/users/' + userId + '/signature';

            var self = this;
            /*if (sign_authority) {
             this.drawSign(sign);
             } else {
             alert('You don\'t have signing auhority');
             }*/

            //self.drawSign();
            $.ajax({
                url    : url,
                success: function (response) {
                    //custom.canvasDraw({imageSrc: response}, self);
                    self.drawSign(response.signImage);
                    //self.drawSign(response);
                },
                error  : function () {
                    custom.canvasDraw(null, self);
                }
            });

        },

        drawSign: function (argsSign) {
            var self = this;
            var sign = argsSign;
            //var sign = this.currentModel.get('sign_authority');
            var userId = App.sessionData.get('userId');
            var container = self.$el.find('#signInfoBox');
            var signInfo = container.find('svg');
            //var signBox = container.find('#signBox');
            var signBox = this.$el.find('.signature');

            if (sign) {

                signBox.find('img').attr('src', sign).show();
                signBox.find('svg').hide();
                signBox.find('span').html('<a href="javascript:;" id="closeIco">&#10006;</a>');

                //signInfo.hide();
                /*signBox.html('<img id="currentSign" height="90" width="90" src="' + sign + '">');
                signBox.find('span').html('<a href="javascript:;" id="closeIco">&#10006;</a>');
            } else {
                $.ajax({
                    url    : 'users/' + userId + '/signature',
                    success: function (response) {
                        var result = response.signImage;
                        //signInfo.hide();
                        signInfo.after('<img id="currentSign" src="' + result + '"><a href="javascript:;" id="closeIco">&#10006;</a>');
                    },
                    error  : function (err) {
                        self.errorNotification(err)
                    }
                });*/
            }
        },

        deleteSign: function(){
            var signBox = this.$el.find('.signature');

            this.currentModel.set('sign_authority', null);

            signBox.find('img').hide();
            signBox.find('svg').show();
            signBox.find('span').html('Replace Signature');
        },

        uploadSignature: function (e) {
            this.$el.find('.upload').click();
        },

        changeSignature: function (e) {
            var image = this.$el.find('.signImage');
            var self = this;

            custom.getSrc(e, function (err, src) {
                if (err) {
                    return alert(err);
                }

                image.attr('src', src);
            });
        }
    });

    return View;

});