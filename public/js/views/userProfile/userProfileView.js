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
            var imageSRC = this_el.find('#avatar')[0].toDataURL('image/jpeg');
            var logoContainer = $('#topBarLogo');
            var profile;

            profile = {
                first_name : profNameFirst,
                last_name  : profNameLast,
                phone      : profPhone
            };

            var saveData = {
                profile  : profile,
                imageSrc : imageSRC
            };

            $.ajax({
                url         : "/profile",
                type        : "PUT",
                contentType : "application/json; charset=utf-8",
                dataType    : "json",
                data        : JSON.stringify(saveData),

                success: function () {
                    logoContainer.attr('src',imageSRC);
                    alert('Profile updated successfully');

                    App.sessionData.set({
                        user: profNameFirst+' '+profNameLast
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