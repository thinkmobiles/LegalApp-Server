/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsList.html',
    'text!templates/documents/list.html',
    'text!templates/documents/templateList.html'

], function (DocTemp, /*DocList*/DocumentList, ListTemp, TemplateList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemp : _.template(DocTemp),
        //docListTemp : _.template(DocList),
        documentList : _.template(DocumentList),
        listTemp : _.template(ListTemp),
        templateList: _.template(TemplateList),

        activeTemplateId: null,

        initialize: function () {
            var self = this;


            $.ajax({
                url     : '/documents/list',
                success : function(response){
                    self.groupCollection = response;
                    self.render();
                }
            });
        },

        events : {
            "click .templateName" : "searchDocuments",
            "click .searchBtn" : "search",
            "click .templateName, .documentItem": "setActive"
        },

        appendDocTable : function(event){
            var self = this;
            var target = $(event.target);
            var temp_id = target.closest('.nameForDoc').data('id');
            var li_container = target.closest('.docsContainer');
            var searchParams = self.getSearchParams();

            $.ajax({
                url : '/documents/list/'+temp_id,
                data: searchParams,
                success : function(response){
                    li_container.find('#groupedDoc_'+temp_id).html(self.docListTemp({documents : response}));
                }
            });
        },

        setActive: function (event) {
            var target = $(event.target);
            var container = target.closest('ul')[0];
            var $ul = $(container);
            var currentActive = $ul.find('.active');
            var templateId = target.data('id');

            this.activeTemplateId = templateId;

            currentActive.removeClass('active');
            target.addClass('active');
        },

        searchDocuments: function (event) {
            var target = $(event.target);
            var templateId = target.closest('.templateName').data('id');

            this.getDocumentsByTemplateId(templateId);
        },

        getDocumentsByTemplateId: function (templateId) {
            var self = this;
            var searchParams = self.getSearchParams();
            var documentsContainer = self.$el.find("#documentList");

            $.ajax({
                url : '/documents/list/'+templateId,
                data: searchParams,
                success : function(response){
                    documentsContainer.html(self.documentList({documents : response}));
                },
                error : function (response){
                    alert(response.responseJSON.error);
                    console.log(response);
                }
            });
        },

        renderDocumentsList: function (data) {
            var items = data || this.groupCollection;
            //this.$el.find('#listWrap').html(this.listTemp({items : items}));
            this.$el.find('#templateList').html(this.templateList({templates : items}));
        },

        render: function () {
            var items = this.groupCollection;
            this.$el.html(this.mainTemp());
            this.renderDocumentsList(items);

            return this;
        },

        getSearchParams: function () {
            var searchContainer = this.$el.find('#searchContainer');
            var status = searchContainer.find("input[name=status]:checked").val();
            var sort = searchContainer.find("input[name=sort]:checked").val();
            var order = searchContainer.find("input[name=order]:checked").val();
            var params = {
                status: status,
                orderBy: sort,
                order: order
            };

            return params;
        },

        search: function () {
            var self = this;
            var searchParams = self.getSearchParams();
            var url = '/documents/list';

            $.ajax({
                url: url,
                data: searchParams,
                success: function(response) {
                    var templateId = self.activeTemplateId;
                    var template;

                    self.groupCollection = response;
                    self.renderDocumentsList(response);

                    if (templateId) {
                        self.getDocumentsByTemplateId(templateId);
                        template = self.$el.find('#templateList [data-id=' + templateId + ']');
                        $(template).addClass('active');
                    }

                },
                error: function (response) {
                    alert(response.responseJSON.error);
                    console.log(response);
                }
            });
        }

    });

    return View;

});