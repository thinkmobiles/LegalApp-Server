/**
 * Created by root on 12.08.15.
 */

define([
    'text!templates/templatesPreview/createDocumentTemplate.html',
    'text!templates/templatesPreview/reAsignTemplate.html',
    'models/documentModel',
    'models/linkModel',
    'constants/forTemplate',
    'views/templatesPre/docPreView',
    'views/custom/signatureBoxView'

], function (
    CreateTemplate,
    ReasignTemp,
    DocModel,
    LinkModel,
    CONST,
    DocPreView,
    SignView) {

    var View;
    View = Backbone.View.extend({

        initialize: function (options) {
            this.tempInfo = options.model;
            this.fillFields = false;

            if (options.modelDoc){
                this.docModel = options.modelDoc;
                this.fillFields = true;
            }

            this.linkModel = new LinkModel({id : this.tempInfo.link_id});
            this.linkModel.on('sync', this.render, this);

            this.linkModel.fetch();
        },

        mainTemplate  : _.template(CreateTemplate),

        events : {
            "click #createBtnNext" : "goToPreview",
            "click #createBtnSave" : "saveDoc",
            "click #createNewBtn"  : "addContrAgent"

        },

        inviteDataToFields: function(contentObject){
            var this_el = this.$el;
            var myFields = this_el.find('.field_base');
            var employeeInput = this_el.find('#createEmployee');
            var length = myFields.length;
            var myId;
            var myTarget;

            employeeInput.attr('data-sig',contentObject.id);

            if (length){
                for (var i=0; i<length; i+=1){
                    myTarget = $(myFields[i]);
                    myId = myTarget.attr('data-id');
                    myTarget.val(contentObject[CONST[myId]]);
                }
            }
        },

        collectValues : function(){
            var links = this.linkModel.toJSON();
            var values = {};
            var this_el = this.$el;


            links.linkFields.forEach(function(field){
                values[field.name] = this_el.find('#create_'+field.id).val().trim();
            });

            return values;
        },

        addContrAgent: function() {
            var self = this;
            var this_el = self.$el;
            var firstName = this_el.find('#createNewFN').val().trim();
            var lastName = this_el.find('#createNewLN').val().trim();
            var email = this_el.find('#createNewEM').val().trim();
            var employeeInput; //.attr('data-sig',contentObject.id);
            var inviteData;

            if (!firstName || !lastName || !email){
                return alert('Fill, please, all fields');
            }

            employeeInput = this_el.find('#createEmployee');

            inviteData = {
                email      : email,
                first_name : firstName,
                last_name  : lastName
            };

            $.ajax({
                url  : "/employees",
                type : "POST",
                data : inviteData,
                success: function(res) {
                    var model = res.model;

                    employeeInput.attr('data-sig', model.id);
                    employeeInput.val(firstName+' '+lastName);
                    self.inviteDataToFields(model);
                },
                error: function(err) {
                    self.errorNotification(err)
                }
            });
        },

        chooseThisSigner: function(context){
            var signersId = $('#signersContainer').find('input:checked').closest('li').data('id');

            if (signersId){
                context.signMyDoc(signersId, false)
            } else {
                alert('Choose some user!')
            }
        },

        goToPreview: function(){
            var values = this.collectValues();

            this.dialogView = new DocPreView({
                modelId     : this.tempInfo.id,
                modelValues : values
            });

            this.dialogView.on('saveInParent', this.saveDoc, this);
            this.dialogView.on('sendInParent', this.beginToSendMyDoc, this);
        },

        saveDoc: function(){
            var self = this;
            var myModel = self.fillFields ? self.docModel : new DocModel();
            var data;
            var userId;
            var values = self.collectValues();

            data = {
                template_id : self.tempInfo.id,
                values      : values
            };

            if (!self.fillFields){
                userId = self.$el.find('#createEmployee').attr('data-sig');
                data.employee_id = +userId;
            }

            myModel.save(data,{
                success: function(){
                    alert('Document was saved successfully');
                    Backbone.history.navigate('documents/list', {trigger : true});
                },
                error: function(response, xhr){
                    self.errorNotification(xhr)
                }
            });
        },

        beginToSendMyDoc : function(){
            var self = this;
            var sesData = App.sessionData.toJSON();
            var signatureView;

            if (sesData.sign_authority){
                if (sesData.companyId === 1){
                    if (sesData.has_sign_image){
                        this.signMyDoc(false, false)
                    } else {
                        alert('Your signature is not uploaded. Contact, please, with your administrator! ')
                    }
                } else {
                    signatureView = new SignView();
                    signatureView.on('iAccept', function(response){
                        self.signMyDoc(false, response)
                    }, this);
                }
            } else {
                this.showResignWindow();
            }
        },

        signMyDoc: function(assignedUser, signatureImage){
            var self = this;
            var data;
            var values = self.collectValues();
            var url;
            var docId;
            var userId;

            data = {values : values};
            if (assignedUser){
                data.assigned_id = assignedUser;
            }

            if (signatureImage){
                data.signature = signatureImage;
            }

            if (self.fillFields){
                docId = self.docModel.get('id');
                url = '/documents/' + docId + '/signAndSend';
            } else {
                url ='/documents/signAndSend';
                userId = self.$el.find('#createEmployee').attr('data-sig');
                data.template_id = self.tempInfo.id;
                data.employee_id = +userId;
            }

            $.ajax({
                url         : url,
                type        : 'POST',
                contentType : "application/json; charset=utf-8",
                dataType    : "json",
                data        : JSON.stringify(data),
                success : function(){
                    alert('A document was sent successfully');
                    Backbone.history.navigate('/documents/list', {trigger : true});
                },
                error : function(err){
                    self.errorNotification(err)
                }
            });
        },

        showResignWindow: function(){
            var self = this;

            $.ajax({
                url  : '/users/search',
                data : {'signAuthority' : true},
                success : function(result) {
                    self.$el.find('#reAsignContainer').html(_.template(ReasignTemp)({signUsers : result})).dialog({
                        autoOpen   : true,
                        dialogClass: "reSignDialog",
                        modal      : true,
                        width      : "600px",
                        buttons    : [
                            {
                                text: "Select and send",
                                click: function(){
                                    self.chooseThisSigner(self)
                                }
                            }
                        ]
                    });
                },
                error : function(err) {
                    self.errorNotification(err)
                }
            });
        },

        createOurPage: function(){
            var thisEl = this.$el;
            var model = this.linkModel.toJSON();
            var self = this;
            var employeeField;
            var filledValues = {};
            var headName = this.tempInfo.name;

            if (this.fillFields){
                filledValues = this.docModel.get('values');
                headName = this.docModel.get('name');
            }

            var for_template = _.map(model.linkFields, function(item){
                var result = {};
                var type = item.type;
                result.id_ = 'create_'+item.id;
                result.name_ = item.name;
                result.value_ = filledValues[item.name] ? filledValues[item.name] : '';
                if (type === 'DATE') {
                    result.class_ = 'field_date';
                    return result;
                }
                if (type === 'STRING' || type === 'NUMBER'){
                    result.class_ = 'field_text';
                    return result;
                }

                result.class_ = 'field_base';
                result.type_ = item.type;
                return result;
            });

            thisEl.html(this.mainTemplate({
                links : for_template,
                tName : headName
            }));

            thisEl.find('.field_date').datepicker({
                dateFormat  : "d M, yy",
                changeMonth : true,
                changeYear  : true
            });

            employeeField = self.$el.find('#createEmployee');
            employeeField.autocomplete({
                source: function(req, res){
                    var myTerm = req.term;

                    $.ajax({
                        url      : "/employees/search",
                        data     : {
                            value  : myTerm
                        },
                        success : function(response){
                            res(response);
                        },
                        error : function (err){
                            self.errorNotification(err)
                        }
                    });
                },
                autoFocus : true,
                select: function(e, ui){
                    self.inviteDataToFields(ui.item);
                },
                minLength : 0
                });
        },

        render: function () {

            this.undelegateEvents();
            this.createOurPage();
            this.delegateEvents();

            return this;
        }

    });

    return View;

});