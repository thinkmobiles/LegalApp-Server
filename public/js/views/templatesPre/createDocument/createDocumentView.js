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

        className   : "addItemLeft",

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
            "click #createBtnSave" : "letsSaveDoc"
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

        goToPreview: function(){
            var values = this.collectValues();

            this.dialogView = new DocPreView({
                modelId     : this.tempInfo.id,
                modelValues : values
            });

            this.dialogView.on('saveInParent', this.saveDoc, this);
        },

        letsSaveDoc : function(){
            this.saveDoc();
        },

        saveDoc: function(status){
            var self = this;
            var assignedId = this.$el.find('#createEmployee').attr('data-sig');
            var myModel = this.fillFields ? this.docModel : new DocModel();
            var data;
            var values = this.collectValues();

            data = {
                template_id : this.tempInfo.id,
                user_id     : assignedId,
                values      : values
            };

            myModel.save(data,{
                success: function(response){
                    var sendData;

                    if (self.dialogView){
                        self.dialogView.remove();
                    }

                    if (status === 2) {
                        sendData = {
                            id       : response.get('id'),
                            assignId : response.get('assigned_id')
                        };
                        self.signMyDoc(sendData);
                    } else {
                        alert('Document was saved successfully');
                        Backbone.history.navigate('documents/list', {trigger : true});
                    }
                },
                error: function(){
                    alert('error'); //todo -error-
                }
            });
        },

        signMyDoc: function(sendData){
            //var self = this;
            var docId = sendData.id;
            var sesData = App.sessionData.toJSON();

            if (sesData.companyId !==1) {
                if (sesData.sign_authority) {
                    new SignView();
                } else {
                    $.ajax({
                        url  : '/users/search',
                        data : {'signAuthority' : true},
                        success : function(result) {
                            _.template(ReasignTemp)(result).dialog();
                        }
                    });

                }
            }


        },

        sendMyDoc: function(sendData){
            $.ajax({
                url  : "/documents/"+docId+"/signAndSend",
                type : "POST",
                //data : {assigned_id : assignId},

                success : function(){
                    alert('A document was sent successfully');
                    Backbone.history.navigate('/documents/list', {trigger : true});
                },
                error : function(model){
                    alert('Error on sending');
                    //self.errorNotification(model);
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
                        url      : "/users/search",
                        data     : {
                            value : myTerm,
                            format : 'single'
                        },
                        success  : function(response){
                            res(response);
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