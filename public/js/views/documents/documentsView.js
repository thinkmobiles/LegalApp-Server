/**
 * Created by root on 28.07.15.
 */

define([
    'views/documents/docInProgressView',
    'text!templates/documents/documentsMainTemplate.html',
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsGridTemplate.html',
    'text!templates/documents/templatesListTemplate.html'


], function (DocInProgressView, MainTemplate, DocumentList, DocumentGrid, TemplateList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemplate  : _.template(MainTemplate),
        document_list : _.template(DocumentList),
        document_grid : _.template(DocumentGrid),
        templateList  : _.template(TemplateList),

        activeTemplateId: null,

        initialize: function (options) {
            var self = this;

            this.stateModel = new Backbone.Model();
            this.stateModel.set('viewType', options.viewType);
            this.listenTo(this.stateModel, 'change:viewType', this.getDocumentsByTemplateId);
            this.listenTo(this.stateModel, 'change:searchParams', this.search);

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
            "click .searchBtn"   : "getSearchParams",
            "click .templateListName": "setActive",
            "click .btnViewType" : "changeViewType",
            "click .documentItem": "goToPreview"
        },


        goToPreview: function(event){
            var target = $(event.target).closest('.documentItem');
            var targetId = target.data('id');
            var targetStatus = target.data('val');
            if (targetStatus === 1) {
                Backbone.history.navigate('documents/preview/' + targetId, {trigger: true});
            } else {
                new DocInProgressView({id : targetId, status : targetStatus});
                //Backbone.history.navigate('documents/inProgress/' + targetId, {trigger: true});
            }
        },

        renderDocumentsList: function (data) {
            var items = data || this.groupCollection;

            this.$el.find('#templateList').html(this.templateList({templates : items}));
            //*************************************
            //this.$el.find('#documentList').mCustomScrollbar({
            //    axis:"y",
            //    theme:"dark",
            //    setHeight: "70px"
            //});
            //*************************************
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

            this.getDocumentsByTemplateId();
        },

        getDocumentsByTemplateId: function (argTemplateId) {
            var self = this;

            if(!this.activeTemplateId){
                this.activeTemplateId = this.$el.find('.templateItem').first().data('id');
            }

            var templateId = this.activeTemplateId || argTemplateId;
            var searchParams = self.stateModel.get('searchParams');

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
                    self.clearOurView();
                }
            });
        },

        createOurView: function(){
            var documentsContainer = this.$el.find("#mCSB_1_container");
            var curColl = this.currentCollByIds;
            var viewType = this.stateModel.get('viewType');
            var templateName = 'document_'+viewType;

            documentsContainer.html(this[templateName]({documents: curColl}));
            //if (viewType === 'list') {
            //    documentsContainer.html(this.documentList({documents: curColl}));
            //} else {
            //    documentsContainer.html(this.documentGrid({documents: curColl}));
            //}

            /*documentsContainer.mCustomScrollbar({
                axis:"y",
                theme:"dark",
                setHeight: "70px",
                onInit:function(){
                    alert("scrollbars initialized");
                }
            });*/

            documentsContainer.mCustomScrollbar("update");

            Backbone.history.navigate("documents/"+viewType);

        },

        clearOurView: function(){
            var documentsContainer = this.$el.find("#documentList");

            documentsContainer.html('');
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
            var fromDate = searchContainer.find('.fromDate').val();
            var toDate = searchContainer.find('.toDate').val();
            var params = {
                status   : status,
                orderBy  : sort,
                order    : order,
                name     : templateName,
                userName : userName,
                from     : fromDate,
                to       : toDate
            };

            this.stateModel.set('searchParams', params);
        },

        search: function () {
            var self = this;
            //var searchParams = self.getSearchParams();
            var searchParams = self.stateModel.get('searchParams');
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
        },

        render: function () {
            var items = this.groupCollection;

            this.$el.html(this.mainTemplate());
            this.renderDocumentsList(items);
            this.getDocumentsByTemplateId();

            this.$el.find('#documentList').mCustomScrollbar({
                axis:"y",
                theme:"dark",
                setHeight: "700px"
            });

            this.$el.find('.fromDate, .toDate').datepicker({
                dateFormat  : "d M, yy",
                changeMonth : true,
                changeYear  : true
            });

            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_document').addClass('active')
        }

    });

    return View;

});