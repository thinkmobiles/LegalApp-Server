/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/userProfile/userProfileTemplate.html',
    'custom'
], function (UsrProfTemp, custom) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            this.currentModel = new Backbone.Model({
                firstName : '',
                lastName  : '',
                phone     : '',
                company   : ''
            });

            this.listenTo(this.currentModel,"change",this.render);

            this.getUserData();

        },

        events: {
          "click #profSaveBut" : "saveProfile"
        },

        getUserData: function(){
            var self = this;
            $.ajax({
                url    : "/currentUser",
                type   : "GET",

                success: function (response) {
                    self.currentModel.set({
                        firstName : response.profile.first_name,
                        lastName  : response.profile.last_name,
                        phone     : response.profile.phone,
                        company   : response.company[0].name
                    });
                },
                error  : function () {
                    alert('error'); // todo -error-
                }
            });
        },

        letsDrawCanvas : function (){
            var self = this;

            $.ajax({
                url    : "/getAvatar",
                type   : "GET",

                success: function (response) {
                    custom.canvasDraw({ imageSrc : response}, self);
                },
                error  : function () {
                    custom.canvasDraw(null, self);
                }
            });


        },

        saveProfile: function(){
            var this_el = this.$el;
            var profNameFirst = this_el.find('#profFName').val().trim();
            var profNameLast  = this_el.find('#profLName').val().trim();
            var profPhone = this_el.find('#profPhone').val().trim();
            var photoInput = this_el.find('#inputImg')[0].files.length;
            var newPass = this_el.find('#profPass').val().trim();
            var imageSRC;
            //var logoContainer = $('#topBarLogo');
            var saveData={};
            var pass;
            var confirmPass;

            saveData.profile = {
                first_name : profNameFirst,
                last_name  : profNameLast,
                phone      : profPhone
            };

            if (newPass) {
                pass = this_el.find('#profCurPass').val().trim();
                confirmPass = this_el.find('#profConfPass').val().trim();
                if (newPass === confirmPass){
                    saveData.password = pass;
                    saveData.newPassword = newPass;
                } else {
                    return alert ('Please confirm password');
                }
            }

            if (photoInput){
                imageSRC = this_el.find('#avatar')[0].toDataURL('image/jpeg');
                saveData.imageSrc = imageSRC;
            }

            $.ajax({
                url         : "/profile",
                type        : "PUT",
                contentType : "application/json; charset=utf-8",
                dataType    : "json",
                data        : JSON.stringify(saveData),

                success: function (response) {
                    var userInfo = response.user;
                    var avatar = userInfo.avatar.url;
                    var fName = userInfo.profile.first_name;
                    var lName = userInfo.profile.last_name;
                    //$('#topBarLogo').attr('src',imageSRC);
                    //$('#topBarLogo').attr('src', avatar);
                    alert('Profile updated successfully');

                    //App.sessionData.set({
                    //    user: profNameFirst+' '+profNameLast
                    //});
                    App.sessionData.set({
                        avatar     : avatar,
                        first_name : fName,
                        last_name  : lName
                    });
                    Backbone.history.navigate("users", {trigger: true});
                },
                error  : function (err) {
                    alert('error: '+err); // todo -error-
                }
            });
        },

        render: function () {
            var tempData = this.currentModel.toJSON();

            this.$el.html(_.template(UsrProfTemp)(tempData));

            this.letsDrawCanvas();

            return this;
        }

    });

    return View;

});