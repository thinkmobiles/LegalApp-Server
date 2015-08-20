/**
 * Created by root on 12.08.15.
 */

define([
    'text!templates/tempPreview/createDocumentTemplate.html',
    'models/documentModel',
    'models/linkModel',
    'constants/forTemplate'

], function (CreateTemplate, DocModel, LinkModel, CONST) {

    var View;
    View = Backbone.View.extend({

        className   : "addItemLeft",

        initialize: function (options) {
            this.tempInfo = options.model;

            this.currentStModel = new Backbone.Model();
            this.linkModel = new LinkModel(this.tempInfo.link_id);
            this.linkModel.on('sync', this.render, this);
            this.currentStModel.on('change', this.inviteDataToFields, this);

            this.linkModel.fetch();
        },

        mainTemplate  : _.template(CreateTemplate),

        events : {
            "click #createButton" : "letsCreateDoc"
        },

        inviteDataToFields: function(){
            var myFields = this.$el.find('.basicField');
            var length = myFields.length;
            var myId;
            var myTarget;
            if (length){
                for (var i=0; i<length; i++){
                    myTarget = $(myFields[i]);
                    myId = myTarget.attr('data-id');
                    myTarget.val(this.currentStModel.get(CONST[myId]));
                }
            }
        },

        letsCreateDoc: function(){
            var links = this.linkModel.toJSON()[0];
            var values = {};
            var data;
            var this_el = this.$el;
            var myModel = new DocModel();

            links.linkFields.forEach(function(field){
                values[field.name] = this_el.find('#create_'+field.id).val().trim();
            });

            data = {
                template_id : this.tempInfo.id,
                values      : values
            };

            myModel.save(data,{
                success: function(){
                    alert('success');
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
            tempData.a_date = [];
            tempData.a_interactiv = [];
            tempData.a_basic = [];

            model.linkFields.forEach(function(link){
                switch (link.type) {
                    case 'DATE' : tempData.a_date.push(link);
                        break;
                    case 'STRING' : tempData.a_interactiv.push(link);
                        break;
                    case 'NUMBER' : tempData.a_interactiv.push(link);
                        break;
                    default : tempData.a_basic.push(link);
                }
            });

            this.$el.html(this.mainTemplate({
                links : model.linkFields,
                tName : this.tempInfo.name
            }));

            tempData.a_date.forEach(function(item){
                self.$el.find('#create_'+item.id).datepicker({
                    dateFormat: "d M, yy",
                    changeMonth: true,
                    changeYear: true
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
                            var theResult = [];
                            response.forEach(function(item){
                                    item.value = (item.profile.first_name+' '+item.profile.last_name);
                                    theResult.push(item);
                            });

                            res(theResult);
                        }
                    });
                },
                autoFocus : true,
                select: function(e, ui){
                    self.currentStModel.set(ui.item);
                },
                minLength : 1
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