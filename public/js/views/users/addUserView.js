/**
 * Created by andrey on 19.07.15.
 */

define([
    'text!templates/users/addUserTemplate.html',
    'text!templates/forSelect/companyNamesTemplate.html',
    'models/userModel'

], function (AddUserTemplate, CompanyName, UserModel) {

    var View;

    View = Backbone.View.extend({

        companyTemp : _.template(CompanyName),

        currentState : true,

        events: {
            "click #addInvite"     : "inviteUser",
            "click .selThisComp"   : "selectCurrentCompany",
            "click #goSaveCompany" : "goSaveCompany"
        },

        initialize: function () {
            this.render();
        },

        showSelect: function(event){
            event.stopPropagation();
            event.preventDefault();

            var target = $(event.target);
            target.closest('#selectedCompany').toggleClass('active');
            target.closest('.sellCont').find('.sellList').toggle();
        },

        selectCurrentCompany: function(event){
            var target = $(event.target);
            var comId = target.data('id');
            var comName = target.text().trim();
            var resultField = this.$el.find('#selectedCompany');

            resultField.text(comName);
            resultField.attr('data-id', comId);
        },

        goSaveCompany: function(){
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
                    self.renderCompanies();
                },
                error   : function(){}
            });
        },

        inviteUser: function (){
            var thisEL = this.$el;
            var self   = this;
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
                permissions : this.currentState ? permissions : (permissions+10)
            };

            if (!this.currentState && +companyId === 0){
                return alert("Enter, please, your client's company!");
            }

            if (!this.currentState) {
                inviteData.companyId = companyId;
            }

            this.userModel = new UserModel();

            this.userModel.save(inviteData,{
                wait : true,
                success : function(){
                    alert('User invited successfully');

                    firstName.val('');
                    lastName.val('');
                    phone.val('');
                    email.val('');
                    sel_company.text('Select company');
                    sel_company.attr('data-id', 0);

                    self.trigger('redirectList');
                },
                error : function(){
                    alert('Error'); // todo message
                }
            });
        },

        renderCompanies : function(){
            var self = this;

            $.ajax({
                url  : "/companies",
                type : "GET",

                success : function(response){
                    self.$el.find('#companyNames').html(self.companyTemp({coll : response}));
                }
            });
        },

        render: function () {
            var role = App.sessionData.get('permissions');
            var company = App.sessionData.get('companyId');

            this.$el.html(_.template(AddUserTemplate)({
                edit   : false,
                role   : role,
                company: company
            }));

            this.renderCompanies();

            return this;
        }

    });
    return View;
});