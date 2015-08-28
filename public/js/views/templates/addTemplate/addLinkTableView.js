/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/templates/addTemplate/addLinkTableTemplate.html',
    'text!templates/forSelect/baseLinksTemplate.html',
    'models/linkModel'
], function (AddTemplate, TypesList, LinkModel) {

    var View;
    View = Backbone.View.extend({

        id        : "addItemRight",
        className : "addItemRight",

        initialize: function () {
            this.render();
        },

        events : {
            "click #addingBut"    : "addNewRow",
            "click .baseType"     : "selectTypes",
            "click #saveButton"   : "saveNewValues"
        },

        saveNewValues : function(){
            var self = this;
            var linkModel;
            var saveData;
            var thisEl = this.$el;
            var linksArray  = thisEl.find('.link_row');
            var arrayLength = linksArray.length;
            var tableName   = thisEl.find('#tabName').val().trim();
            var currentTarget;
            var name;
            var code;
            var theType;
            var values = [];

            if (arrayLength){
                for (var i=arrayLength-1; i>=0; i--){
                    currentTarget = $(linksArray[i]);
                    name = currentTarget.find('.frst').text().trim();
                    code = currentTarget.find('.scnd').text().trim();
                    theType = currentTarget.find('.thrd').attr('data-val');

                    values.push({
                        name   : name,
                        code   : code,
                        type   : theType
                    });
                }
            }

            saveData = {
                name        : tableName,
                link_fields : values
            };

            linkModel = new LinkModel();
            linkModel.save(saveData,{
                wait  : true,
                success : function(){
                    //self.hideDialog();
                    self.trigger('renderParentLinks');
                    alert('Links were created successfully');
                },
                error   : function(){
                    alert('Error');  //todo -error message-
                }
            });
        },

        addNewRow: function(){
            var thisEl = this.$el;
            var activeName = thisEl.find('#addingName');
            var activeCode = thisEl.find('#addingCode');
            var activeType = thisEl.find('#addingBase');
            var name = activeName.val().trim();
            var code = activeCode.val().trim();
            var theType = activeType.val().trim();
            var theType_id = activeType.attr('data-val');
            var newRow;

            if (name && code){
                newRow = "<tr class='link_row'><td class='frst'>"+name+"</td><td class='scnd'>"+code+"</td><td class='thrd' data-val="+theType_id+">"+theType+"</td></tr>";
                thisEl.find('#linksList').append(newRow);

                activeName.val('');
                activeCode.val('');
                activeType.val('String');
                activeType.attr('data-val','STRING')
            } else {
                alert('Please, fill empty fields');
            }
        },

        selectTypes: function (event){
            var target = $(event.target);
            var currentValue = target.text().trim();
            var currentConst = target.attr('data-val');
            var cont = this.$el.find('#addingBase');

            cont.val(currentValue);
            cont.attr('data-val', currentConst);
        },

        render: function () {

            this.undelegateEvents();
            this.$el.html(_.template(AddTemplate));

            this.delegateEvents();

            this.$el.find('#baseLink').html(_.template(TypesList));

            return this;
        }

    });

    return View;

});