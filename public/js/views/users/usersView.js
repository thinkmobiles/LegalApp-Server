/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html',
    'text!templates/forSelect/companyNamesTemplate.html',
    'collections/usersCollection',
    'views/users/editUserView',
    'text!templates/users/usersListTemplate.html'

], function (
    UsersTemplate,
    CompanyName,
    UsersCollection ,
    EditUserView,
    UsrListTemp) {

    var View;

    View = Backbone.View.extend({

        el : '#wrapper',

        companyTemp : _.template(CompanyName),
        mainTemp    : _.template(UsersTemplate),
        listTemp    : _.template(UsrListTemp),

        events: {
            "click #addNewUser"              : "showAddTemplate",
            "click .userRow:not(.activeRow)" : "showEditTemplate",
            "click .activeRow"               : "hideEdit",
            "click #adminClient>span "       : "changeCurrentState",
            "click .sel_item"                : "selectSomething",
            "click .sel_container"           : "showHideSelect",
            "click #goSaveCompany"           : "goSaveCompany",
            "click #addInvite"               : "inviteUser"
        },

        initialize: function () {
            this.stateModel = new Backbone.Model();
            this.stateModel.set('isOurCompUsers', true);
            this.usersCollection = new UsersCollection();

            this.render();

            this.listenTo(this.stateModel, 'change:isOurCompUsers', this.changeView);
            this.listenTo(this.usersCollection, 'appendUsers', this.renderUsersList);
            //this.listenTo(this.clientsCollection, 'reset', this.renderUsersList);

            this.usersCollection.showMore({first : true});
        },

        selectSomething: function(event){
            var target = $(event.target);
            var container = target.closest('.sel_container');
            var result = container.find('.sel_result');
            var newId;

            result.text(target.text());
            newId = target.attr('data-id');
            result.attr('data-id', newId);
        },

        showHideSelect: function(event){
            var target = $(event.target);
            if (target.context.id !== 'newCompName'){
                target.closest('.sel_container').toggleClass('active');
            }
        },

        changeCurrentState: function(event){
            var target = $(event.target);
            var container = target.closest('#adminClient');
            var sel_visible = $('#hideCompany');
            var theState;

            container.find('.active').removeClass('active');
            target.addClass('active');

            theState = !!+target.data('id');
            this.stateModel.set('isOurCompUsers', theState);

            if (theState){
                sel_visible.addClass('hide');
            } else {
                sel_visible.removeClass('hide');
            }
        },

        hideEdit: function(event){
            $(event.target).closest('.activeRow').removeClass('activeRow');

            if (this.editView){
                this.editView.remove()
            }
        },

        changeView : function(){
            var theState = this.stateModel.get('isOurCompUsers');

            //if (this.addView){
            //    this.addView.currentState=theState;
            //}

            this.usersCollection.showMore({
                first   : true,
                clients : !theState
            });

            //if (theState) {
            //    this.usersCollection.fetch({reset: true})
            //} else {
            //    this.clientsCollection.fetch({reset: true})
            //}
        },

        renderUsersList : function(is_new){
            var theState = this.stateModel.get('isOurCompUsers');
            var isNew = is_new || false;

            this.$el.find('#listTable').html(this.listTemp({
                usrLst : this.usersCollection.toJSON(),
                state  : theState
            }));

        },

        //addTemplate : function(){
        //
        //    if (this.addView){
        //        this.addView.undelegateEvents()
        //    }
        //
        //    this.addView = new AddUserView();
        //    this.addView.on('redirectList', this.changeView, this);
        //    this.$el.find('#addUserContainer').html(this.addView.el);
        //},

        showEditTemplate : function(event){
            var userRow = $(event.target).closest('.userRow');
            var userID  = userRow.data('id');
            var container = userRow.closest('#listTable');
            var theState = this.stateModel.get('isOurCompUsers');
            var editableUser;

            container.find('.activeRow').removeClass('activeRow');
            userRow.addClass('activeRow');

            if (this.editView){
                this.editView.remove()
            }

            editableUser = this.usersCollection.get(userID);
            editableUser.currentState = theState;

            this.editView = new EditUserView({userModel : editableUser});
            this.editView.on('redirectList', this.changeView, this);

            userRow.after(this.editView.el);
        },

        renderCompanies : function(){
            var self = this;

            $.ajax({
                url  : "/companies",
                success : function(response){
                    self.$el.find('#companyNames').html(self.companyTemp({coll : response}));
                }
            });
        },

        goSaveCompany: function(event){
            event.preventDefault();
            event.stopPropagation();

            var self = this;
            var this_el = this.$el;
            var newCompany = this_el.find('#newCompName').val().trim();
            var resultField = this_el.find('#selectedCompany');

            $.ajax({
                url : '/companies',
                type : 'POST',
                data : {name : newCompany},
                success : function(response){
                    var model = response.model;
                    resultField.text(model.name);
                    resultField.attr('data-id', model.id);
                    resultField.closest('.sel_container').removeClass('active');
                    self.renderCompanies();
                },
                error   : function(){}
            });
        },

        inviteUser: function (){
            var self   = this;
            var theState = self.stateModel.get('isOurCompUsers');
            var thisEL = self.$el;
            var firstName = thisEL.find('#addFName');
            var lastName  = thisEL.find('#addLName');
            var phone = thisEL.find('#addPhone');
            var email = thisEL.find('#addEmail');
            var permissions = thisEL.find(".addRole").data('id');
            var sel_company = thisEL.find("#selectedCompany");
            var companyId = sel_company.attr('data-id');

            var inviteData = {
                first_name  : firstName.val().trim(),
                last_name   : lastName.val().trim(),
                phone       : phone.val().trim(),
                email       : email.val().trim(),
                permissions : theState ? permissions : (permissions+10)
            };

            if (!theState && +companyId === 0){
                return alert("Enter, please, your client's company!");
            }

            if (!theState) {
                inviteData.companyId = companyId;
            }

            //this.userModel = new UserModel();

            //this.userModel.save(inviteData,{
            this.usersCollection.create(inviteData,{
                wait : true,
                success : function(){
                    alert('User invited successfully');

                    firstName.val('');
                    lastName.val('');
                    phone.val('');
                    email.val('');
                    sel_company.text('Select company');
                    sel_company.attr('data-id', 0);

                    //self.trigger('redirectList');
                },
                error : function(){
                    alert('Error'); // todo message
                }
            });
        },

        render: function () {
            var role = App.sessionData.get('permissions');
            var company = App.sessionData.get('companyId');

            this.$el.html(this.mainTemp({
                role    : role,
                company : company
            }));

            this.$el.find('#tablesContent').mCustomScrollbar({
                theme:"dark",
                setHeight : '600px',
                scrollInertia: 0
            });

            //this.changeView();
            this.renderCompanies();

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
