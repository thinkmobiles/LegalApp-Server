/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/templates/addTemplate/addTemplateTemplate.html',
    'text!templates/templates/addTemplate/linkFieldsTemplate.html',
    'text!templates/templates/addTemplate/linkNamesTemplate.html',
    'views/addLinkTable/addLinkTableView',
    'models/templateModel',
    'collections/linksCollection',
    'custom'

], function (TempTemplate, LinkFilTemp, LinkNamTemp, AddLinkView, TempModel, LinksCollection, custom) {

    var View;
    View = Backbone.View.extend({

        id          : "addItemLeft",
        className   : "addItemLeft",

        //currentFile : null,

        initialize: function () {
            this.linksCollection = new LinksCollection();
            //this.$el.find("#addItemLeft").show();

            this.render();
        },

        mainTemplate  : _.template(TempTemplate),
        linksFieldsTemplate : _.template(LinkFilTemp),
        linksNamesTemplate  : _.template(LinkNamTemp),

        events : {
            "click #addNewLink"  : "showLinksTable",
            "click .linkName"    : "linkSelect",
            "click #tempSave"    : "saveTemplate"
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

        showLinksTable: function(){
            this.addDialogView = new AddLinkView();
            this.addDialogView.on('renderParentLinks', this.appendLinksNames, this);
            $('#addTemplateContainer').append(this.addDialogView.el);
        },

        saveTemplate: function(){
            var this_el = this.$el;
            var form = this_el.find('#addTempForm')[0];
            var formData = new FormData(form);
            //formData.append('templateFile', this_el.find('#tempFile')[0].files[0]);

            $.ajax({
                url: '/templates',
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function(request){
                    console.log(request);
                    alert('Template was invited successfully');
                }
            })
        },

        /*saveTemplate: function(){
            var self = this;
            var this_el;
            var name;
            var link;
            var data;
            this_el = this.$el;
            var file = this_el.find('#tempFile')[0].files[0];
            var forma =this_el.find('#addTempForm');
            //name = this_el.find('#tempName').val().trim();
            //link = this_el.find('#tempLinkTable').data('id');

            //data = {
            //    name : name,
            //    link_id : link,
            //    file : file
            //};

            forma.submit(function(e){
                e.preventDefault();

                forma.ajaxSubmit({
                    url: "http://" + window.location.host +"/uploadFiles",
                    type: "POST",
                    processData: false,
                    contentType: false,
                    data: data,
                    success: function(){alert('fffff')},
                    error: function(){alert('fyyyyy')}
                })
            });

        },*/

        linkSelect: function(event){
            var thisEl = this.$el;
            var fakeInput = thisEl.find('#fakeLinkTable');
            var target = $(event.target);
            var linkID = target.data('id');
            var resultTarget = thisEl.find('#tempLinkTable');
            var linkModel = this.linksCollection.get(linkID);

            resultTarget.val(target.text());
            fakeInput.val(linkID);
            thisEl.find('#linksFields').html(this.linksFieldsTemplate({lnkFields : linkModel.get('linkFields')}));
        },

        render: function () {
            //var self = this;

            this.undelegateEvents();
            this.$el.html(this.mainTemplate);
            this.delegateEvents();

            this.appendLinksNames();
            //custom.docXLoad(this, function(result){
            //    self.currentFile = result;
            //});

            return this;
        }

    });

    return View;

});