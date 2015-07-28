/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/userProfile/userProfileTemplate.html'
], function (UsrProfTemp) {

    var View;
    View = Backbone.View.extend({

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

        saveProfile: function(){
            var profNameFirst = this.$el.find('#profFName').val().trim();
            var profNameLast = this.$el.find('#profLName').val().trim();
            var profPhone = this.$el.find('#profPhone').val().trim();

            var saveData = {
                first_name : profNameFirst,
                last_name  : profNameLast,
                phone      : profPhone
            };

            $.ajax({
                url    : "/profile",
                type   : "PUT",
                data   : saveData,

                success: function () {
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
            return this;
        }

    });

    return View;

});