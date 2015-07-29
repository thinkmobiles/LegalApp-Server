/**
 * Created by root on 27.07.15.
 */

define([
    'text!templates/addTemplate/addTemplateTemplate.html',
    'text!templates/addTemplate/linkFieldsTemplate.html',
    'views/addLinkTable/addLinkTableView',
    'collections/linksCollection'

], function (TempTemplate, LinkFilTemp, AddLinkView, LinksCollection) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.linksCollection = new LinksCollection();

            this.listenTo(this.linksCollection, 'reset', this.render);
        },

        mainTemplate  : _.template(TempTemplate),
        linksTemplate : _.template(LinkFilTemp),

        events : {
            "click #addNewLink"  : "showLinksTable",
            "click .linkName"    : "linkSelect"
        },

        showLinksTable: function(){
            new AddLinkView();
        },

        linkSelect: function(event){
            var target = $(event.target);
            var linkID = target.data('id');
            var linkModel = this.linksCollection.get(linkID);

            this.$el.find('#linksFields').html(this.linksTemplate({lnkFields : linkModel.get('linkFields')}));
        },

        render: function () {
            var linkColl = this.linksCollection.toJSON();

            this.$el.html(this.mainTemplate({lnkColl : linkColl}));
            return this;
        }

    });

    return View;

});