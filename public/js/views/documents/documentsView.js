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
            var self = this;

            this.stateModel = new Backbone.Model();
            this.stateModel.set({
                viewType      : options.viewType,
                activeId      : null
            });

            this.listenTo(this.stateModel, 'change:viewType', this.getDocumentsByTemplateId);
            this.listenTo(this.stateModel, 'change:searchParams', this.search);

            this.docCollection = new TitledDocs();
            this.docTitles = new TitleColl();

            this.docTitles.on('trueSearch', this.renderTitlesList, this);
            this.docCollection.on('showMore', this.renderDocuments, this);

            this.docTitles.fetch({
                reset   : true,
                success : function (){
                    self.render()
                }
            });
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

            templatesContainer.html(this.templateList({templates : items}));

            if (firstTitleId) {
                this.getDocumentsByTemplateId(firstTitleId);
            }
        },

        //docReset : function(){
        //
        //},

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

            //this.activeTemplateId = target.data('id');
            var activeId = target.attr('data-id');
            this.stateModel.set('activeId', activeId);

            container.find('.active').removeClass('active');
            target.addClass('active');

            this.getDocumentsByTemplateId(activeId);
        },

        getDocumentsByTemplateId: function (argTemplateId) {
            var self = this;

            //if(!this.activeTemplateId){
            //    this.activeTemplateId = this.$el.find('.templateItem').first().data('id');
            //}

            var templateId = this.stateModel.get('activeId') || argTemplateId;
            var searchParams = self.stateModel.get('searchParams');

            this.docCollection.tempId = templateId;
            this.docCollection.searchParams = searchParams;
            this.docCollection.showMore({first : true});

            /*$.ajax({
                url : '/documents/list/'+templateId,
                data: searchParams,
                success : function(response){
                    self.currentCollByIds = response;
                    self.renderDocuments();
                },
                error : function (response){
                    alert(response.responseJSON.error);
                    console.log(response);
                }
            });*/
        },

        onScrollEnd: function (){
            this.docCollection.showMore();
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


            //documentsContainer.mCustomScrollbar("update");

            Backbone.history.navigate("documents/"+viewType);

        },

        //clearOurView: function(){
        //    var documentsContainer = this.$el.find("#documentList");
        //
        //    documentsContainer.html('');
        //},

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
            //var searchParams = self.getSearchParams();
            var searchParams = self.stateModel.get('searchParams');

            this.docTitles.letsSearch(searchParams);

            /*var url = '/documents/list';

            $.ajax({
                url: url,
                data: searchParams,
                success: function(response) {
                    var templateId = self.activeTemplateId;
                    var template;

                    self.groupCollection = response;
                    self.renderTitlesList(response);

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
            });*/
        },

        render: function () {
            var state = this.stateModel.get('viewType');
            var self = this;

            this.$el.html(this.mainTemplate({state : state}));

            this.$el.find('#documentList').mCustomScrollbar({
                axis      :"y",
                theme     :"dark",
                callbacks :{
                    onTotalScroll : function(){
                        self.docCollection.showMore();
                    }
                }

            });

            this.$el.find('#templateList').mCustomScrollbar({
                axis:"y",
                theme:"dark"
            });

            this.renderTitlesList();

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