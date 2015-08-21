/**
 * Created by root on 12.08.15.
 */

define([
    'text!templates/tempPreview/createDocumentTemplate.html',
    'models/documentModel',
    'models/linkModel',
    'constants/forTemplate',
    'views/tempPre/docPreView'

], function (CreateTemplate, DocModel, LinkModel, CONST, DocPreView) {

    var View;
    View = Backbone.View.extend({

        className   : "addItemLeft",

        initialize: function (options) {
            this.tempInfo = options.model;

            this.linkModel = new LinkModel(this.tempInfo.link_id);
            this.linkModel.on('sync', this.render, this);

            this.linkModel.fetch();
        },

        mainTemplate  : _.template(CreateTemplate),

        events : {
            "click #createButton" : "letsCreateDoc"
        },

        inviteDataToFields: function(contentObject){
            var this_el = this.$el;
            var myFields = this_el.find('.basicField');
            var employeeInput = this_el.find('#createEmployee');
            var length = myFields.length;
            var myId;
            var myTarget;

            employeeInput.attr('data-sig',contentObject.id);
            if (length){
                for (var i=0; i<length; i++){
                    myTarget = $(myFields[i]);
                    myId = myTarget.attr('data-id');
                    myTarget.val(contentObject[CONST[myId]]);
                }
            }
        },

        letsCreateDoc: function(){
            var links = this.linkModel.toJSON()[0];
            var values = {};
            var data;
            var this_el = this.$el;
            var assignedId = this_el.find('#createEmployee').attr('data-sig');
            var myModel = new DocModel();

            links.linkFields.forEach(function(field){
                values[field.name] = this_el.find('#create_'+field.id).val().trim();
            });

            data = {
                template_id : this.tempInfo.id,
                assigned_id : assignedId,
                values      : values
            };

            myModel.save(data,{
                success: function(response){
                    var curId = response.get('model').id;
                    new DocPreView({modelId : curId});
                },
                error: function(){
                    alert('error'); //todo -error-
                }
            });
        },

        createOurPage: function(){
            var model = this.linkModel.toJSON()[0];
            var tempData = {};
            var self = this;
            var employeeField;
            tempData.a_date  = [];
            tempData.a_interactiv = [];
            tempData.a_basic = [];

            model.linkFields.forEach(function(link){
                switch (link.type) {
                    case 'DATE'  : tempData.a_date.push(link);
                        break;
                    case 'STRING': tempData.a_interactiv.push(link);
                        break;
                    case 'NUMBER': tempData.a_interactiv.push(link);
                        break;
                    default      : tempData.a_basic.push(link);
                }
            });

            this.$el.html(this.mainTemplate({
                links : model.linkFields,
                tName : this.tempInfo.name
            }));

            tempData.a_date.forEach(function(item){
                self.$el.find('#create_'+item.id).datepicker({
                    dateFormat  : "d M, yy",
                    changeMonth : true,
                    changeYear  : true
                })
            });

            tempData.a_basic.forEach(function(item){
                var el=self.$el.find('#create_'+item.id);
                el.addClass('basicField');
                el.attr('data-id',item.type);
            });

            employeeField = self.$el.find('#createEmployee');
            employeeField.autocomplete({
                source: function(req, res){
                    var myTerm = req.term;

                    $.ajax({
                        url      : "/users/search",
                        data     : {value : myTerm},
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