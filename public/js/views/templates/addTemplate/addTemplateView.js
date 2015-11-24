/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/templates/addTemplate/addTemplateTemplate.html',
    'text!templates/templates/addTemplate/descriptionTextTemplate.html',
    'text!templates/forSelect/linkNamesTemplate.html',
    'text!templates/forSelect/tempNamesTemplate.html',
    'views/templates/addTemplate/addLinkTableView',
    'models/templateModel',
    'collections/linksCollection'

], function (TempTemplate,
             DescriptionText,
             LinkNamTemp,
             TempNames,
             AddLinkView,
             TempModel,
             LinksCollection) {

    var View;
    View = Backbone.View.extend({

        className   : "addItemLeft",
        editableView: false,

        initialize: function (options) {
            var self = this;

            this.parentContext = options.parentCont;
            this.linksCollection = new LinksCollection();

            if (options.tempId) {
                this.editableView = true;
                this.tempModel = new TempModel({id: options.tempId});
                this.tempModel.fetch({
                    success: function () {
                        self.render();
                    }
                })
            } else {
                this.tempModel = new TempModel();
                self.render();
            }
        },

        mainTemplate      : _.template(TempTemplate),
        linksNamesTemplate: _.template(LinkNamTemp),
        tempNamesTemplate : _.template(TempNames),
        descriptionField  : _.template(DescriptionText),

        events: {
            "click #addNewLink"      : "showLinksTable",
            "click #tempSave"        : "saveTemplate",
            "click .closeCurrentView": "closeCurrentView",
            "click .short_text"      : "showDescriptionField",
            "click #descriptBtn"     : "insertDescriptionText",
        },

        appendLinksNames: function () {
            var linkColl;
            var linksContainer = this.$el.find('#linkContainer');
            var self = this;

            this.linksCollection.fetch({
                reset  : true,
                success: function (collection) {
                    linkColl = collection.toJSON();
                    linksContainer.html(self.linksNamesTemplate({lnkColl: linkColl}));
                }
            });
        },

        appendTempNames: function () {
            var tempContainer = this.$el.find('#tempNames');
            var tempColl = this.parentContext.tempCollection.toJSON();

            tempContainer.html(this.tempNamesTemplate({tempNames: tempColl}));
        },

        showDescriptionField: function (event) {
            var self = this;
            var container = $('#addTemplateAppender');
            var targetId = $(event.target).attr('id');
            var textType;
            if (targetId === 'tempDescription') {
                textType = 'description'
            } else {
                textType = 'description'
            }

            container.html(this.descriptionField({
                text   : self.tempModel.get(textType),
                descrip: textType
            }));
            container.find('#descriptBtn').click(function (event) {
                var textType = $(event.target).attr('data-id');
                self.insertDescriptionText(self, textType)
            });
        },

        insertDescriptionText: function (self, textType) {
            var container = $('#addTemplateAppender');
            var textForSave = container.find('#descriptBtnArea').val();
            var textForButton;
            var resultButton;

            if (textForSave !== '') {
                textForButton = textForSave.slice(0, 15) + '...';
                if (textType === 'description') {
                    resultButton = self.$el.find('#tempDescription');
                    resultButton.text(textForButton);
                    resultButton.attr('data-id', 1);
                    self.tempModel.set('description', textForSave);
                } else {
                    resultButton = self.$el.find('#tempMarketing');
                    resultButton.text(textForButton);
                    resultButton.attr('data-id', 1);
                    self.tempModel.set('marketing_content', textForSave);
                }
            }

            container.html('');
        },

        showLinksTable: function () {

            if (this.addDialogView) {
                this.addDialogView.remove()
            }

            this.addDialogView = new AddLinkView();
            this.addDialogView.on('renderParentLinks', this.appendLinksNames, this);
            $('#addTemplateAppender').html(this.addDialogView.el);
        },

        saveTemplate: function () {
            var self = this;
            var this_el = self.$el;
            var linkedTemplateId;
            var linkTableId;
            var file;
            var name;
            var needDscr;
            var needMrkt;

            var inputData = new FormData();
            name = this_el.find('#tempName').val();
            inputData.append('name', name);

            file = this_el.find('#tempFile')[0].files[0];

            if (file) {
                inputData.append('templateFile', file);
            }

            linkedTemplateId = +this_el.find('#tempLinkedTemp').attr('data-id');
            if (linkedTemplateId === 0) {
                inputData.append('linked_templates', '');
            } else {
                inputData.append('linked_templates', [linkedTemplateId]);
            }

            linkTableId = +this_el.find('#tempLinkTable').attr('data-id');
            if (linkTableId) {
                inputData.append('link_id', linkTableId);
            }

            needDscr = +this_el.find('#tempDescription').attr('data-id');
            if (needDscr) {
                inputData.append('description', this.tempModel.get('description'));
            }

            //data = new FormData();

            //data.append('data', JSON.stringify(inputData));

            /*linkedTemplateId = +this_el.find('#tempLinkedTemp').data('id');
             if (linkedTemplateId){
             formData.append('linked_templates', [linkedTemplateId])
             }

             linkTableId = +this_el.find('#tempLinkTable').data('id');
             if (linkTableId){
             formData.append('link_id', linkTableId)
             }

             if (this.editableView){
             requestType = 'PUT';
             url += '/'+this.tempModel.get('id');
             }

             descriptionText = this.tempModel.get('description');
             if (descriptionText) {
             formData.append('description', descriptionText)
             }*/

            //$.ajax({
            //    url : url,
            //    type: requestType,
            //    data: formData,
            //    contentType: false,
            //    processData: false,
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
            //var testModel = new TempModel();
            this.tempModel.save(null, {
                data       : inputData,
                processData: false,
                contentType: false,
                success    : function (response) {
                    alert('Template was added successfully');
                    var model = response.get('model');
                    self.parentContext.tempCollection.add(model);
                },
                error      : function (response, xhr) {
                    self.errorNotification(xhr)
                }
            });
            //****************************************************
        },

        /*addTemplate: function(){

         },

         editTemplate : function (){

         },*/

        //linkSelect: function(event){
        //    var thisEl = this.$el;
        //    var fakeInput = thisEl.find('#fakeLinkTable');
        //    var target = $(event.target);
        //    var linkID = target.data('id');
        //    var resultTarget = thisEl.find('#tempLinkTable');
        //
        //    target.closest('#linkContainer').hide();
        //    resultTarget.val(target.text());
        //    fakeInput.val(linkID);
        //},

        closeCurrentView: function () {
            this.remove();
        },

        docXupload: function () {
            var self = this;
            var this_el = self.$el;
            var inputFile = this_el.find('#tempFile');

            inputFile.on('change', function (event) {
                event.preventDefault();

                var file = inputFile[0].files[0];
                var filesExt = 'docx';
                var parts = $(inputFile).val().split('.');
                var ourName = parts[parts.length - 1];

                if (filesExt === ourName) {
                    var fr = new FileReader();
                    fr.onload = function () {
                        this_el.find('#fakeTempFile').val(file.name);
                    };
                    fr.readAsDataURL(file);
                } else {
                    if (ourName) {
                        alert('Invalid file type!');
                    }
                }
            });
        },

        render: function () {
            this.undelegateEvents();
            if (this.editableView) {
                this.$el.html(this.mainTemplate({
                    edit     : true,
                    tempModel: this.tempModel.toJSON()
                }));
            } else {
                this.$el.html(this.mainTemplate({
                    edit: false
                }))
            }
            this.delegateEvents();

            this.docXupload();
            this.appendLinksNames();
            this.appendTempNames();

            return this;
        }

    });

    return View;

});