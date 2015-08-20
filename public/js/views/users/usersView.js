/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html',
    'collections/usersCollection',
    'views/users/addUserView',
    'views/users/editUserView',
    'views/users/usersListView'

], function (UsersTemplate, UsersCollection , AddUserView , EditUserView, UsrListView) {

    var View;

    View = Backbone.View.extend({

        el : '#wrapper',

        events: {
            "click #addNewUser"        : "showAddTemplate",
            "click .userRow"           : "showEditTemplate",
            "click #adminClient>span " : "changeCurrentState"
        },

        initialize: function () {
            this.stateModel = new Backbone.Model();
            this.stateModel.set('currentState', true);
            this.render();

            this.usersCollection = new UsersCollection();
            this.clientsCollection = new Backbone.Collection();
            this.clientsCollection.url = "/clients";

            this.listenTo(this.stateModel, 'change:currentState', this.renderTrigger);
            this.listenTo(this.usersCollection, 'reset', this.renderUsersList);
            this.listenTo(this.clientsCollection, 'reset', this.renderUsersList);
        },

        changeCurrentState: function(event){
            var target = $(event.target);
            var container = target.closest('#adminClient');
            var sel_visible = $('#selectedCompany');
            var theState;

            container.find('.active').removeClass('active');
            target.addClass('active');

            theState = !!+target.data('id');
            this.stateModel.set('currentState', theState);

            if (theState){
                sel_visible.hide();
            } else {
                sel_visible.show();
            }
        },

        renderTrigger : function(){
            var theState = this.stateModel.get('currentState');

            if (this.addView){
                this.addView.currentState=theState;
            }

            if (theState) {
                this.usersCollection.fetch({reset: true})
            } else {
                this.clientsCollection.fetch({reset: true})
            }
        },

        renderUsersList : function(){
            var theState = this.stateModel.get('currentState');

            if (this.tableView){
                this.tableView.undelegateEvents()
            }

            if (theState) {
                this.tableView = new UsrListView({
                    coll : this.usersCollection,
                    state: true
                });
            } else {
                this.tableView = new UsrListView({
                    coll: this.clientsCollection,
                    state : false
                });
            }
        },

        addTemplate : function(){

            if (this.addView){
                this.addView.undelegateEvents()
            }

            this.addView = new AddUserView();
            this.addView.on('redirectList', this.renderTrigger, this);
            this.$el.find('#addUserContainer').html(this.addView.el);
        },

        showEditTemplate : function(event){
            var userRow = $(event.target).closest('.userRow');
            var userID  = userRow.data('id');
            //var container = userRow.closest('#listTable');
            var theState = this.stateModel.get('currentState');
            var editableUser;

            //container.find('.active').removeClass('active');
            //userRow.addClass('active');

            if (this.editView){
                this.editView.undelegateEvents()
            }

            if (theState) {
                editableUser = this.usersCollection.get(userID);
            } else {
                editableUser = this.clientsCollection.get(userID);
            }

            this.editView = new EditUserView({userModel : editableUser});
            this.editView.on('redirectList', this.renderTrigger, this);
            //this.$el.find('#addUserContainer').html(this.addView.el);
        },

        render: function () {
            this.$el.html(_.template(UsersTemplate));

            this.addTemplate();

            return this;
        }

    });
    return View;
});
