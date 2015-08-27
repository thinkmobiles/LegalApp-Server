/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsMainTemplate.html',
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsGridTemplate.html',
    'text!templates/documents/templatesListTemplate.html'


], function (MainTemplate, DocumentList, DocumentGrid, TemplateList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemplate : _.template(MainTemplate),
        documentList : _.template(DocumentList),
        documentGrid : _.template(DocumentGrid),
        templateList : _.template(TemplateList),

        activeTemplateId: null,

        initialize: function (options) {
            var self = this;

            this.stateModel = new Backbone.Model();
            this.stateModel.set('viewType', options.viewType);
            this.listenTo(this.stateModel, 'change:viewType', this.getDocumentsByTemplateId);

            $.ajax({
                url     : '/documents/list',
                success : function(response){
                    self.groupCollection = response;
                    self.render();
                }
            });
        },

        events : {
            "click .filters"     : "showHideFilters",
            "click #templateList .templateName" : "searchDocuments", //TODO
            "click .searchBtn"   : "search",
            "click .templateName": "setActive",
            "click .btnViewType" : "changeViewType",
            "click .documentItem": "goToPreview"
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

        goToPreview: function(event){
            var targetId = $(event.target).data('id');
            Backbone.history.navigate('documents/preview/'+targetId, {trigger : true});
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

        getDocumentsByTemplateId: function (argTemplateId) {
            var self = this;
            var templateId = this.activeTemplateId || argTemplateId;
            var searchParams = self.getSearchParams();

            $.ajax({
                url : '/documents/list/'+templateId,
                data: searchParams,
                success : function(response){
                    self.currentCollByIds = response;
                    self.createOurView();
                },
                error : function (response){
                    alert(response.responseJSON.error);
                    console.log(response);
                }
            });
        },

        createOurView: function(){
            var documentsContainer = this.$el.find("#documentList");
            var curColl = this.currentCollByIds;
            var viewType = this.stateModel.get('viewType');

            if (curColl.length > 0){
                if (viewType === 'list') {
                    documentsContainer.html(this.documentList({documents: curColl}));
                } else {
                    documentsContainer.html(this.documentGrid({documents: curColl}));
                }
                Backbone.history.navigate("documents/"+viewType);
            }
        },

        changeViewType: function(event){
            var targetView = $(event.target).data('id');
            this.stateModel.set('viewType',targetView);

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