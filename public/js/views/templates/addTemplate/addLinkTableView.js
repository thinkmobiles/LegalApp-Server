/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/templates/addTemplate/addLinkTableTemplate.html',
    'text!templates/forSelect/baseLinksTemplate.html',
    'text!templates/templates/addTemplate/editableRow.html',
    'models/linkModel'
], function (
    AddTemplate,
    TypesList,
    EditRow,
    LinkModel) {

    var View;
    View = Backbone.View.extend({

        id        : "addItemRight",
        className : "addItemRight",

        editRowTemp : _.template(EditRow),

        initialize: function () {
            this.render();
        },

        events : {
            "click #addingBut"    : "addNewRow",
            "click .baseType"     : "selectTypes",
            "click #saveButton"   : "saveNewValues",
            "dblclick .link_row"  : "changeThisRow"
        },

        autoAppendValues: function(){
            var container = this.$el.find('#linksList');
            var editRow = container.find('#editableRow');
            var resultRow = container.find('.activeRow');

            var eName = editRow.find('#editName').val().trim();
            var eCode = editRow.find('#editCode').val().trim();
            var eType = editRow.find('#editTable').val().trim();
            var eType_id = editRow.find('#editTable').attr('data-val');

            resultRow.find('.frst').text(eName);
            resultRow.find('.scnd').text(eCode);
            resultRow.find('.thrd').text(eType);
            resultRow.find('.thrd').attr('data-val', eType_id);

            editRow.remove();
            resultRow.removeClass('activeRow');
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
            var indikator = thisEl.find('#editableRow').length;

            if (indikator > 0){
                this.autoAppendValues();
            }

            if (arrayLength){
                for (var i=arrayLength-1; i>=0; i-=1){
                    currentTarget = $(linksArray[i]);
                    name = currentTarget.find('.frst').text().trim();
                    code = currentTarget.find('.scnd').text().trim();
                    theType = currentTarget.find('.thrd').attr('data-val');

                    values.push({
                        name  : name,
                        code  : code,
                        type  : theType
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
            var indikator = thisEl.find('#editableRow').length;

            if (indikator > 0){
                this.autoAppendValues();
            }

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

        changeThisRow: function(event){
            var target = $(event.target).closest('.link_row');
            var container = target.closest('#linksList');

            var indikator = this.$el.find('#editableRow').length;

            if (indikator > 0){
                this.autoAppendValues();
            }

            container.find('.activeRow').removeClass('activeRow');
            target.addClass('activeRow');

            var eName = target.find('.frst').text().trim();
            var eCode = target.find('.scnd').text().trim();
            var eType = target.find('.thrd').text().trim();
            var eType_id = target.find('.thrd').attr('data-val');

            var eData = {
                eName    : eName,
                eCode    : eCode,
                eType    : eType,
                eType_id : eType_id
            };

            //container.find('#editableRow').remove();
            target.after(this.editRowTemp(eData));
        },

        render: function () {
            var this_el = this.$el;

            this.undelegateEvents();
            this_el.html(_.template(AddTemplate));
            this.delegateEvents();

            this_el.find('#baseLink').html(_.template(TypesList));

            return this;
        }

    });

    return View;

});