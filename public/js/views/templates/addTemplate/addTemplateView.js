/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/templates/addTemplate/addTemplateTemplate.html',
    'text!templates/templates/addTemplate/linkFieldsTemplate.html',
    'text!templates/templates/addTemplate/linkNamesTemplate.html',
    'views/addLinkTable/addLinkTableView',
    'collections/linksCollection'

], function (TempTemplate, LinkFilTemp, LinkNamTemp, AddLinkView, LinksCollection) {

    var View;
    View = Backbone.View.extend({

        id        : "addItemLeft",
        className : "addItemLeft",
        linkNames : [],

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
            "click .linkName"    : "linkSelect"
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

        //afterRender : function(){
        //    this.appendLinksNames();
        //},

        showLinksTable: function(){

            //if (this.addDialogView){
            //    this.addDialogView.undelegateEvents()
            //}

            this.addDialogView = new AddLinkView();
            this.addDialogView.on('renderParentLinks', this.appendLinksNames, this);
            $('#addTemplateContainer').append(this.addDialogView.el);
        },

        linkSelect: function(event){
            var thisEl = this.$el;
            var target = $(event.target);
            var linkID = target.data('id');
            var resultTarget = thisEl.find('#tempLinkTable');
            var linkModel = this.linksCollection.get(linkID);

            resultTarget.val(target.text());
            resultTarget.attr('data-id',linkID);
            thisEl.find('#linksFields').html(this.linksFieldsTemplate({lnkFields : linkModel.get('linkFields')}));
        },

        render: function () {

            this.undelegateEvents();
            this.$el.html(this.mainTemplate);
            this.delegateEvents();

            this.appendLinksNames();

            return this;
        }

    });

    return View;

});