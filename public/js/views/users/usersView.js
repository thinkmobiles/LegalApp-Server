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
            "click #addNewUser"              : "showAddTemplate",
            "click .userRow:not(.activeRow)" : "showEditTemplate",
            "click .activeRow"               : "hideEdit",
            "click #adminClient>span "       : "changeCurrentState",
            "click .sel_item"                : "selectSomething",
            "click .sel_container"           : "showHideSelect"
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

        selectSomething: function(event){
            $('.sel_container .active').removeClass('active');

            var target = $(event.target);
            var container = target.closest('.sel_container');
            var result = container.find('.sel_result');
            var newId;

            result.text(target.text());
            newId = target.attr('data-id');
            result.attr('data-id', newId);
        },

        showHideSelect: function(event){
            $('.sel_container .active').removeClass('active');

            var target = $(event.target);
            target.closest('.sel_container').addClass('active');
            //target.closest('.sellCont').find('.sellList').toggle();
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

        hideEdit: function(event){
            $(event.target).closest('.activeRow').removeClass('activeRow');

            if (this.editView){
                this.editView.remove()
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
            var container = userRow.closest('#listTable');
            var theState = this.stateModel.get('currentState');
            var editableUser;

            container.find('.activeRow').removeClass('activeRow');
            userRow.addClass('activeRow');

            if (this.editView){
                //this.editView.undelegateEvents()
                this.editView.remove()
            }

            if (theState) {
                editableUser = this.usersCollection.get(userID);
                //this.editView = new EditUserView({
                //    userColl : this.usersCollection,
                //    userId   :  userID
                //});
            } else {
                editableUser = this.clientsCollection.get(userID);
                //this.editView = new EditUserView({
                //    userColl : this.clientsCollection,
                //    userId   :  userID
                //});
            }

            editableUser.currentState = theState;
            this.editView = new EditUserView({userModel : editableUser});
            this.editView.on('redirectList', this.renderTrigger, this);
            //this.$el.find('#addUserContainer').html(this.addView.el);
            userRow.after(this.editView.el);
        },

        render: function () {
            this.$el.html(_.template(UsersTemplate));

            this.addTemplate();

            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_users').addClass('active')
        }

    });
    return View;
});
