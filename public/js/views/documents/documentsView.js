/**
 * Created by root on 28.07.15.
 */

define([
    'views/documents/docInProgressView',
    'text!templates/documents/documentsMainTemplate.html',
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsGridTemplate.html',
    'text!templates/documents/templatesListTemplate.html',
    'collections/titlesCollection',
    'collections/titledDocsCollection'

], function (
    DocInProgressView,
    MainTemplate,
    DocumentList,
    DocumentGrid,
    TemplateList,
    TitleColl,
    TitledDocs) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemplate  : _.template(MainTemplate),
        document_list : _.template(DocumentList),
        document_grid : _.template(DocumentGrid),
        templateList  : _.template(TemplateList),

        activeTemplateId: null,

        initialize: function (options) {
            this.stateModel = new Backbone.Model();
            this.stateModel.set({
                viewType      : options.viewType,
                activeId      : null
            });

            this.docCollection = new TitledDocs();
            this.docTitles = new TitleColl();

            this.render();

            this.listenTo(this.stateModel, 'change:viewType', this.getDocumentsByTemplateId);
            this.listenTo(this.stateModel, 'change:searchParams', this.search);
            this.docTitles.on('showMore', this.renderTitlesList, this);
            this.docCollection.on('showMore', this.renderDocuments, this);
        },

        events : {
            "click .filters"     : "showHideFilters",
            "click .searchBtn"   : "getSearchParams",
            "click .templateListName": "setActive",
            "click .btnViewType" : "changeViewType",
            "click .docClick"    : "goToPreview",
            "click #closeIco"    : "showHideFilters"
        },


        goToPreview: function(event){
            var target = $(event.target).closest('.documentItem');
            var targetId = target.attr('data-id');
            var targetStatus = target.data('val');
            if (targetStatus === 1) {
                Backbone.history.navigate('documents/preview/' + targetId, {trigger: true});
            } else {
                new DocInProgressView({id : targetId, status : targetStatus});
            }
        },

        renderTitlesList: function (firstTitleId) {
            var items = this.docTitles.toJSON();
            var container = this.$el.find("#templateList");
            var templatesContainer = container.find(".mCSB_container");

            if (firstTitleId) {
                templatesContainer.html(this.templateList({templates : items}));
                if (firstTitleId !== true) {
                    this.getDocumentsByTemplateId(firstTitleId);
                }
            } else {
                templatesContainer.append(this.templateList({templates : items}));
            }
        },

        showHideFilters: function () {
            var this_el = this.$el;
            var target = this_el.find('.filters');
            var searchContainer = this_el.find("#searchContainer");

            searchContainer.toggleClass('hidden');
            target.toggleClass('active');
        },

        setActive: function (event) {
            var target = $(event.target).closest('.templateItem');
            var container = target.closest('ul');
            var activeId = target.attr('data-id');

            this.stateModel.set('activeId', activeId);

            container.find('.active').removeClass('active');
            target.addClass('active');

            this.getDocumentsByTemplateId(activeId);
        },

        getDocumentsByTemplateId: function (argTemplateId) {
            var self = this;
            var templateId = this.stateModel.get('activeId') || argTemplateId;
            var searchParams = self.stateModel.get('searchParams');

            this.docCollection.tempId = templateId;
            this.docCollection.searchParams = searchParams || {};
            this.docCollection.showMore({first : true});
        },

        renderDocuments: function(needAppend){
            var container = this.$el.find("#documentList");
            var documentsContainer = container.find(".mCSB_container");
            var curColl = this.docCollection.toJSON();
            var viewType = this.stateModel.get('viewType');
            var templateName = 'document_'+viewType;

            if (needAppend){
                documentsContainer.append(this[templateName]({documents: curColl}));
            } else {
                documentsContainer.html(this[templateName]({documents: curColl}));
            }

            Backbone.history.navigate("documents/"+viewType);

        },

        changeViewType: function(event){
            var target = $(event.target);

            this.stateModel.set('viewType', target.attr('data-id'));
            this.$el.find('.btnViewType.active').removeClass('active');
            target.addClass('active');
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

            this.docTitles.searchParams = self.stateModel.get('searchParams');
            this.docTitles.showMore({first : true});

        },

        render: function () {
            var state = this.stateModel.get('viewType');
            var self = this;

            this.$el.html(this.mainTemplate({state : state}));

            this.$el.find('#documentList').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                callbacks :{
                    onTotalScroll : function(){
                        self.docCollection.showMore();
                    }
                }
            });

            this.$el.find('#templateList').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                callbacks :{
                    onTotalScroll : function(){
                        self.docTitles.showMore();
                    }
                }
            });

            this.$el.find('.fromDate, .toDate').datepicker({
                dateFormat  : "d M, yy",
                changeMonth : true,
                changeYear  : true
            });

            this.docTitles.searchParams = {};
            this.docTitles.showMore({first : true});

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