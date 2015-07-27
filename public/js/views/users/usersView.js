/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html',
    'collections/usersCollection',
    'views/users/addUserView',
    'views/users/usersListView'

], function (UsersTemplate, UsersCollection , AddUserView , UsrListView) {

    var View;

    View = Backbone.View.extend({


        events: {
            "click #addNewUser" : "showAddTemplate",
            "click .userRow"    : "showEditTemplate"
        },

        initialize: function () {
            this.render();

            this.usersCollection = new UsersCollection();

            this.listenTo(this.usersCollection, 'reset', this.renderUsersList);

        },

        renderUsersList : function(){

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            if (this.usersCollection.length) {
                this.tableView = new UsrListView({coll: this.usersCollection});
            }

        },

        showAddTemplate : function(){

            if (this.addView){
                this.addView.undelegateEvents()
            }

            this.addView = new AddUserView();
            this.$el.find('#addUserContainer').html(this.addView.el);
        },

        showEditTemplate : function(event){
            var userID = $(event.target).closest('.userRow').data('id');
            var editableUser;

            if (this.addView){
                this.addView.undelegateEvents()
            }

            editableUser = this.usersCollection.get(userID);

            this.addView = new AddUserView({userModel : editableUser});
            this.$el.find('#addUserContainer').html(this.addView.el);
        },

        render: function () {

            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });
    return View;
});
