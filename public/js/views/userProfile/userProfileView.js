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

            //this.render();

            this.listenTo(this.currentModel,"change",this.render);

            this.getUserData();

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
                        company   : response.profile.company
                    });
                },
                error  : function () {
                    alert('error'); // todo -error-
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