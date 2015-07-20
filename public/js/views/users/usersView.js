/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html',
    'views/users/addUserView',
    'views/users/usersListView'

], function (UsersTemplate , AddUserView , UsrListView) {

    var View;

    View = Backbone.View.extend({


        events: {
            "click #addNewUser" : "showAddTemplate"
        },

        initialize: function () {
            this.currentUsersList = [
                {name : 'name1', role : 'role1'},
                {name : 'name2', role : 'role2'},
                {name : 'name3', role : 'role3'}
            ];



            this.render()
        },

        renderUsersList : function(){
            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            this.tableView = new UsrListView({usrList : this.currentUsersList});

            this.$el.find('table').append(this.tableView.el);
        },

        afterRender : function(){
            this.renderUsersList();
        },

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
