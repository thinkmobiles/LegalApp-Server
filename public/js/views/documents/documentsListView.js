/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsMainTemplate.html',
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/templatesListTemplate.html'

], function (MainTemplate, DocumentList, TemplateList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemplate : _.template(MainTemplate),
        documentList : _.template(DocumentList),
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
            "click .filters" : "showHideFilters",
            "click #templateList .templateName" : "searchDocuments", //TODO
            "click .searchBtn" : "search",
            "click .templateName": "setActive"
        },

        render: function () {
            var items = this.groupCollection;
            //this.$el.html(this.mainTemp());
            this.$el.html(this.mainTemplate());
            this.renderDocumentsList(items);

            this.$el.find('.fromDate, .toDate').datepicker({
                dateFormat  : "d M, yy",
                changeMonth : true,
                changeYear  : true
            });

            return this;
        },

        renderDocumentsList: function (data) {
            var items = data || this.groupCollection;

            this.$el.find('#templateList').html(this.templateList({templates : items}));
        },

        showHideFilters: function (event) {
            var target = $(event.target);
            var searchContainer = this.$el.find("#searchContainer");

            searchContainer.toggleClass('hidden');
            target.toggleClass('active');
        },

        setActive: function (event) {
            var target = $(event.target).closest('.templateItem');
            var container = target.closest('ul');

            this.activeTemplateId = target.data('id');

            container.find('.active').removeClass('active');
            target.addClass('active');
        },

        searchDocuments: function (event) {
            var target = $(event.target);
            var templateId = target.closest('.templateItem').data('id');

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

        getSearchParams: function () {
            var searchContainer = this.$el.find('#searchContainer');
            var status = searchContainer.find(".filterStatus:checked").val();
            var sort = searchContainer.find(".orderBy:checked").val();
            var order = searchContainer.find(".order:checked").val();
            var templateName = searchContainer.find(".templateName").val();
            var userName = searchContainer.find(".userName").val();
            var params = {
                status: status,
                orderBy: sort,
                order: order,
                templateName: templateName,
                userName: userName
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