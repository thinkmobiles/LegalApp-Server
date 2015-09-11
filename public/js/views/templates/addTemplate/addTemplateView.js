/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/templates/addTemplate/addTemplateTemplate.html',
    'text!templates/templates/addTemplate/linkNamesTemplate.html',
    'text!templates/templates/addTemplate/tempNamesTemplate.html',
    'views/templates/addTemplate/addLinkTableView',
    'models/templateModel',
    'collections/linksCollection'

], function (
    TempTemplate,
    LinkNamTemp,
    TempNames,
    AddLinkView,
    TempModel,
    LinksCollection) {

    var View;
    View = Backbone.View.extend({

        className       : "addItemLeft",
        //linkedTemplates : [],
        editableView    : false,

        initialize: function (options) {
            var self = this;

            this.parentContext = options.parentCont;
            this.linksCollection = new LinksCollection();

            if (options.tempId) {
                this.editableView = true;
                this.tempModel = new TempModel({id : options.tempId});
                this.tempModel.fetch({
                    success : function(){
                        self.render();
                    }
                })
            } else {
                self.render();
            }
        },

        mainTemplate  : _.template(TempTemplate),
        linksNamesTemplate  : _.template(LinkNamTemp),
        tempNamesTemplate   : _.template(TempNames),

        events : {
            "click #addNewLink"    : "showLinksTable",
            "click .linkName"      : "linkSelect",
            "click #tempSave"      : "saveTemplate",
            //"click #tempLinkTable" : "showHideTable",
            //"click .tempName"      : "addLinkedTemp",
            "click .closeCurrentView" : "closeCurrentView"
        },

        //addLinkedTemp: function (event){
        //    var target = $(event.target).closest('.tempName');
        //    var name = target.text().trim();
        //    var tempId = target.data('id');
        //    this.$el.find('#tempLinkedTemp').val(name);
        //    //this.linkedTemplates = [tempId];
        //},

        appendLinksNames : function(){
            var linkColl;
            var linksContainer = this.$el.find('#linkContainer');
            var self = this;

            this.linksCollection.fetch({
                reset : true,
                success : function(collection){
                    linkColl = collection.toJSON();
                    linksContainer.html(self.linksNamesTemplate({lnkColl : linkColl}));
                }
            });
        },

        appendTempNames : function(){
            var tempContainer = this.$el.find('#tempNames');
            var tempColl = this.parentContext.tempCollection.toJSON();

            tempContainer.html(this.tempNamesTemplate({tempNames : tempColl}));
        },

        showLinksTable: function(){

            if (this.addDialogView){
                this.addDialogView.remove()
            }

            this.addDialogView = new AddLinkView();
            this.addDialogView.on('renderParentLinks', this.appendLinksNames, this);
            $('#addTemplateContainer').append(this.addDialogView.el);
        },

        //showHideTable: function(){
        //    var target = this.$el.find('#linkContainer');
        //    target.toggle();
        //},

        saveTemplate: function(){
            var self = this;
            var this_el = this.$el;
            var form = this_el.find('#addTempForm')[0];
            var formData = new FormData(form);
            var linkedTemplateId;
            var linkTableId;
            var requestType = 'POST';
            var url = '/templates';

            //if (this.linkedTemplates.length > 0){
            //    formData.append('linked_templates', this.linkedTemplates)
            //}

            linkedTemplateId = +this_el.find('#tempLinkedTemp').data('id');
            if (linkedTemplateId){
                formData.append('linked_templates', [linkedTemplateId])
            }

            linkTableId = +this_el.find('#tempLinkTable').data('id');
            if (linkTableId){
                formData.append('link_id', linkTableId)
            }

            if (this.editableView){
                requestType = 'PUT'
                url += '/'+this.tempModel.get('id');
            }

            $.ajax({
                url : url,
                type: requestType,
                data: formData,
                contentType: false,
                processData: false,
                success: function(response){
                    alert('Template was added successfully');
                    var model = response.model;
                    self.parentContext.tempCollection.add(model);
                },
                error: function(){
                    alert('error'); //todo -error-
                }
            });

            //****************************************************
            //var testModel = new TempModel();
            //testModel.save(formData,{
            //    success: function(response){
            //        alert('Template was added successfully');
            //        var model = response.model;
            //        self.parentContext.tempCollection.add(model);
            //    },
            //    error: function(){
            //        alert('error');
            //    }
            //});
            //****************************************************
        },

        linkSelect: function(event){
            var thisEl = this.$el;
            var fakeInput = thisEl.find('#fakeLinkTable');
            var target = $(event.target);
            var linkID = target.data('id');
            var resultTarget = thisEl.find('#tempLinkTable');

            target.closest('#linkContainer').hide();
            resultTarget.val(target.text());
            fakeInput.val(linkID);
        },

        closeCurrentView: function(){
            this.remove();
        },

        render: function () {
            this.undelegateEvents();
            if (this.editableView){
                this.$el.html(this.mainTemplate({
                        edit     : true,
                        tempModel: this.tempModel.toJSON()
                    }));
            } else {
                this.$el.html(this.mainTemplate({edit : false}))
            }
            this.delegateEvents();

            this.appendLinksNames();
            this.appendTempNames();

            return this;
        }

    });

    return View;

});