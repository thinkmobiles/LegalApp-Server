/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/addLinkTable/addLinkTableTemplate.html',
    'text!templates/addLinkTable/linksListTemplate.html',
    'models/linkModel'
], function (AddTemplate, ListTemplate, LinkModel) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        events : {
            "click #addField"    : "addNewRow",
            "click #saveButton"  : "saveNewValues"
        },

        saveNewValues : function(){
            var self = this;
            var linkModel;
            var saveData;
            var thisEl = this.$el;
            var activeName  = thisEl.find('#editName').val().trim();
            var activeCode  = thisEl.find('#editCode').val().trim();
            var linksArray  = thisEl.find('.link_row');
            var arrayLength = linksArray.length;
            var tableName   = thisEl.find('#tabName').val().trim();
            var currentTarget;
            var name;
            var code;
            var values = [];

            if (activeName && activeCode) {
                values.push({
                    name  : activeName,
                    code  : activeCode
                })
            } else {
                if (!(!activeName && !activeCode)){
                    alert('Please, fill empty fields');
                    return;
                }
            }

            if (arrayLength){
                for (var i=arrayLength-1; i>=0; i--){
                    currentTarget = $(linksArray[i]);
                    name = currentTarget.find('.frst').text().trim();
                    code = currentTarget.find('.scnd').text().trim();

                    values.push({
                        name   : name,
                        code   : code
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
                    self.hideDialog();
                    self.trigger('renderParentLinks');
                    alert('Links were created successfully');
                },
                error   : function(){
                    alert('Error');  //todo -error message-
                }
            });
        },

        hideDialog: function () {
            $('.dialogWindow').remove();
        },

        addNewRow: function(){
            var thisEl = this.$el;
            var activeName = thisEl.find('#editName');
            var activeCode = thisEl.find('#editCode');
            var name = activeName.val().trim();
            var code = activeCode.val().trim();
            var newRow;

            if (name && code){
                newRow = "<tr class='link_row'><td class='frst'>"+name+"</td><td class='scnd'>"+code+"</td></tr>";
                $(newRow).insertBefore('.editableRow');
                activeName.val('');
                activeCode.val('');
            } else {
                alert('Please, fill empty fields');
            }
        },

        render: function () {

            //this.undelegateEvents();
            this.$el.html(_.template(AddTemplate)).dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "dialogWindow",
                modal: true,
                width: "600px"
            });

            //this.delegateEvents();

            return this;
        }

    });

    return View;

});