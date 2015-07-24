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
            "click #addNewUser" : "showAddTemplate"
        },

        initialize: function () {
            this.render();

            this.usersCollection = new UsersCollection();

            this.listenTo(this.usersCollection, 'sync', this.renderUsersList());



        },

        renderUsersList : function(){

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            var usersColl = this.usersCollection.toJSON();
            this.tableView = new UsrListView({coll : usersColl});

            //this.$el.find('usersTable').append(this.tableView.el);
        },

        //afterRender : function(){
        //    this.renderUsersList();
        //},

        showAddTemplate : function(){

            if (this.addView){
                this.addView.undelegateEvents()
            }

            this.addView = new AddUserView();
            this.$el.find('#addNewUser').hide();
            this.$el.find('#addUserContainer').append(this.addView.el);
        },

        render: function () {

            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });
    return View;
});
