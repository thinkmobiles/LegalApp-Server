/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsList.html',
    'text!templates/documents/list.html'

], function (DocTemp, DocList, ListTemp) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemp : _.template(DocTemp),
        docListTemp : _.template(DocList),
        listTemp : _.template(ListTemp),

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
            "click .nameForDoc" : "appendDocTable",
            "click .searchBtn" : "search"
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
                    li_container.find('#groupedDoc_'+temp_id).html(self.docListTemp({data : response}));
                }
            });
        },

        renderDocumentsList: function (data) {
            var items = data || this.groupCollection;
            this.$el.find('#listWrap').html(this.listTemp({items : items}));
        },

        render: function () {
            var items = this.groupCollection;
            this.$el.html(this.mainTemp());
            this.renderDocumentsList(items);

            return this;
        },

        getSearchParamsForList: function () {
            var searchContainer = this.$el.find('#searchContainer');
            var status = searchContainer.find("input[name=status]:checked").val();
            var sort = searchContainer.find("input[name=sort]:checked").val();
            var params = {
                status: status
            };

            if (sort !== 'documents.created_at') {
                params.orderBy = sort; //can't group templates py documents.created_at;
            }

            return params;
        },

        getSearchParams: function () {
            var searchContainer = this.$el.find('#searchContainer');
            var status = searchContainer.find("input[name=status]:checked").val();
            var sort = searchContainer.find("input[name=sort]:checked").val();
            var params = {
                status: status,
                orderBy: sort
            };

            return params;
        },

        search: function () {
            var self = this;
            var searchParams = self.getSearchParamsForList();
            var url = '/documents/list';

            $.ajax({
                url: url,
                data: searchParams,
                success: function(response) {
                    self.groupCollection = response;
                    self.renderDocumentsList(response);
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