/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/templates/addTemplate/addTemplateTemplate.html',
    'text!templates/templates/addTemplate/linkFieldsTemplate.html',
    'text!templates/templates/addTemplate/linkNamesTemplate.html',
    'text!templates/templates/addTemplate/tempNamesTemplate.html',
    'views/templates/addTemplate/addLinkTableView',
    'models/templateModel',
    'collections/linksCollection'

], function (
    TempTemplate,
    LinkFilTemp,
    LinkNamTemp,
    TempNames,
    AddLinkView,
    TempModel,
    LinksCollection) {

    var View;
    View = Backbone.View.extend({

        className       : "addItemLeft",
        linkedTemplates : [],

        initialize: function (options) {

            this.parentContext = options.parentCont;
            this.linksCollection = new LinksCollection();

            this.render();
        },

        mainTemplate  : _.template(TempTemplate),
        linksFieldsTemplate : _.template(LinkFilTemp),
        linksNamesTemplate  : _.template(LinkNamTemp),
        tempNamesTemplate  : _.template(TempNames),

        events : {
            "click #addNewLink"    : "showLinksTable",
            "click .linkName"      : "linkSelect",
            "click #tempSave"      : "saveTemplate",
            "click #tempLinkTable" : "showHideTable",
            "click .tempName"      : "addLinkedTemp"

        },

        addLinkedTemp: function (event){
            var target = $(event.target).closest('.tempName');
            var name = target.text().trim();
            var tempId = target.data('id');
            this.$el.find('#tempLinkedTemp').val(name);
            this.linkedTemplates = [tempId];
        },

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

        showHideTable: function(){
            var target = this.$el.find('#linkContainer');
            target.toggle();

        },

        saveTemplate: function(){
            var self = this;
            var this_el = this.$el;
            var form = this_el.find('#addTempForm')[0];
            var formData = new FormData(form);

            if (this.linkedTemplates.length > 0){
                formData.append('linked_templates', this.linkedTemplates)
            }

            $.ajax({
                url: '/templates',
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function(response){
                    alert('Template was added successfully');
                    var model = response.model;
                    self.trigger('addInParentView', model);
                },
                error: function(){
                    alert('error'); //todo -error-
                }
            })
        },

        linkSelect: function(event){
            var thisEl = this.$el;
            var fakeInput = thisEl.find('#fakeLinkTable');
            var target = $(event.target);
            var linkID = target.data('id');
            var resultTarget = thisEl.find('#tempLinkTable');
            var linkModel = this.linksCollection.get(linkID);

            target.closest('#linkContainer').hide();
            resultTarget.val(target.text());
            fakeInput.val(linkID);
            thisEl.find('#linksFields').html(this.linksFieldsTemplate({lnkFields : linkModel.get('linkFields')}));
        },

        render: function () {

            this.undelegateEvents();
            this.$el.html(this.mainTemplate);
            this.delegateEvents();

            this.appendLinksNames();
            this.appendTempNames();

            return this;
        }

    });

    return View;

});