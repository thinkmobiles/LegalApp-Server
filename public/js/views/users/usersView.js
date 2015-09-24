/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/usersTemplate.html',
    'text!templates/forSelect/companyNamesTemplate.html',
    'collections/usersCollection',
    'views/users/editUserView',
    'text!templates/users/usersListTemplate.html',
    'validation'

], function (
    UsersTemplate,
    CompanyName,
    UsersCollection ,
    EditUserView,
    UsrListTemp,
    Validation) {

    var View;

    View = Backbone.View.extend({

        el : '#wrapper',

        companyTemp : _.template(CompanyName),
        mainTemp    : _.template(UsersTemplate),
        listTemp    : _.template(UsrListTemp),

        events: {
            "click #addNewUser"                 : "showAddTemplate",
            "click .userRow:not(.activeRow)"    : "showEditTemplate",
            "click .activeRow"                  : "hideEdit",
            "click #adminClient>span "          : "changeCurrentState",
            "click .sel_item"                   : "selectSomething",
            "click .sel_container"              : "showHideSelect",
            "click #goSaveCompany"              : "goSaveCompany",
            "click #addInvite"                  : "inviteUser",
            "click .sortableData:not(.letsSort)": "changOrderBy",
            "click .letsSort"                   : "changOrder"


        },

        initialize: function () {
            this.stateModel = new Backbone.Model();
            this.stateModel.set({
                isOurCompUsers : true,
                orderBy: 'company_name',
                order  : 'ASC'
            });

            this.usersCollection = new UsersCollection();

            this.render();

            this.listenTo(this.stateModel, 'change:isOurCompUsers', this.changeView);
            this.listenTo(this.stateModel, 'change:order change:orderBy', this.userListFirstRender);
            this.listenTo(this.usersCollection, 'appendUsers', this.renderUsersList);
            this.listenTo(this.usersCollection, 'add', this.userListFirstRender);
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
            var selVisible = $('#hideCompany');
            var theState;

            container.find('.active').removeClass('active');
            target.addClass('active');

            theState = !!+target.data('id');
            this.stateModel.set('isOurCompUsers', theState);

            if (theState){
                selVisible.addClass('hide');
            } else {
                selVisible.removeClass('hide');
            }
        },

        hideEdit: function(event){
            $(event.target).closest('.activeRow').removeClass('activeRow');

            if (this.editView){
                this.editView.remove()
            }
        },

        userListFirstRender : function() {
            var theState = this.stateModel.get('isOurCompUsers');
            var searchOptions = {
                order   : this.stateModel.get('order'),
                orderBy : this.stateModel.get('orderBy')
            };

            this.usersCollection.showMore({
                first         : true,
                clients       : !theState,
                searchOptions : searchOptions
            });
        },

        changeView : function(){
            var theState = this.stateModel.get('isOurCompUsers');

            this.usersCollection.showMore({
                first   : true,
                clients : !theState
            });

            this.clearAddForm();
        },

        changOrderBy: function(event) {
            var target = $(event.target);
            var container = target.closest('tr');
            var orderBy = target.data('sort');

            container.find('.letsSort').removeClass('letsSort');
            target.addClass('letsSort');

            this.stateModel.set('orderBy', orderBy);
        },

        changOrder: function(event) {
            var target = $(event.target).closest('tr');
            var sortClass = target.attr('class');

            if (sortClass === 'sortUp') {
                target.switchClass('sortUp','sortDn');
                this.stateModel.set('order', 'DESC');
            }

            if (sortClass === 'sortDn') {
                target.switchClass('sortDn','sortUp');
                this.stateModel.set('order', 'ASC');
            }
        },

        renderUsersList : function(is_new){
            var theState = this.stateModel.get('isOurCompUsers');
            var isNew = is_new || false;

            if (isNew){
                this.$el.find('#listTable').html(this.listTemp({
                    usrLst : this.usersCollection.currentPage,
                    state  : theState
                }));
            } else {
                this.$el.find('#listTable').append(this.listTemp({
                    usrLst : this.usersCollection.currentPage,
                    state  : theState
                }));
            }
        },

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
                url     : "/companies",
                success : function(response){
                    self.$el.find('#companyNames').find('.mCSB_container').html(self.companyTemp({coll : response}));

                    /*self.$el.find('#companyNames').mCustomScrollbar({
                        theme               :"dark",
                        alwaysShowScrollbar : 2,
                        autoHideScrollbar   : true
                    });*/
                },
                error : function(err) {
                    self.errorNotification(err);
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

            if (newCompany) {

                $.ajax({
                    url: '/companies',
                    type: 'POST',
                    data: {name: _.escape(newCompany)},
                    success: function (response) {
                        var model = response.model;

                        resultField.text(model.name);
                        resultField.attr('data-id', model.id);
                        resultField.closest('.sel_container').removeClass('active');
                        self.renderCompanies();
                    },
                    error: function (err) {
                        self.errorNotification(err);
                    }
                });
            } else {
                alert('Enter, please, company name');
            }
        },

        clearAddForm : function() {
            var this_el = this.$el;
            var theRole = this_el.find("#addRole");
            var theCompany = this_el.find('#selectedCompany');

            this_el.find('#addFName').val('');
            this_el.find('#addLName').val('');
            this_el.find('#addPhone').val('');
            this_el.find('#addEmail').val('');
            theCompany.text('Select company');
            theCompany.attr('data-id', 0);
            theRole.text('Viewer');
            theRole.attr('data-id', 3);
        },

        inviteUser: function (){
            var self   = this;
            var theState = self.stateModel.get('isOurCompUsers');
            var thisEL = self.$el;
            var firstName = thisEL.find('#addFName').val().trim();
            var lastName  = thisEL.find('#addLName').val().trim();
            var phone = thisEL.find('#addPhone').val().trim();
            var email = thisEL.find('#addEmail').val().trim();
            var permissions = +thisEL.find("#addRole").attr('data-id');
            var companyId = thisEL.find("#selectedCompany").attr('data-id');
            var emailAlert;

            if (!firstName || !lastName || !email || (!theState && companyId==='0')) {
                return alert('Fill, please, all required fields!');
            }

            emailAlert = Validation.checkEmailField({}, email, 'Email');
            if (emailAlert){
                return alert(emailAlert);
            }

            var inviteData = {
                first_name  : _.escape(firstName),
                last_name   : _.escape(lastName),
                phone       : _.escape(phone),
                email       : email,
                permissions : theState ? permissions : (permissions+10)
            };

            if (!theState && +companyId === 0){
                return alert("Enter, please, your client's company!");
            }

            if (!theState) {
                inviteData.companyId = companyId;
            }

            this.usersCollection.create(inviteData,{
                wait    : true,
                success : function(){
                    self.clearAddForm();
                    alert('User invited successfully');
                },
                error : function(model, xhr){
                    self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var self = this;
            var this_el = self.$el;
            var role = App.sessionData.get('permissions');
            var company = App.sessionData.get('companyId');

            this_el.html(this.mainTemp({
                role    : role,
                company : company
            }));

            this_el.find('#tablesContent').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                setHeight           : 680,
                callbacks :{
                    onTotalScroll : function(){
                        var theState = self.stateModel.get('isOurCompUsers');

                        self.usersCollection.showMore({clients : !theState});
                    }
                }
            });

            this_el.find('#companyNames').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0
            });

            this.userListFirstRender();
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
