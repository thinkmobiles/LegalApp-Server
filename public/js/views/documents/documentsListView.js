/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsList.html'

], function (DocTemp, DocList) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemp : _.template(DocTemp),
        docListTemp : _.template(DocList),

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
            "click .nameForDoc" : "appendDocTable"
        },

        appendDocTable : function(event){

            var self = this;
            var target = $(event.target);
            var temp_id = target.closest('.nameForDoc').data('id');
            var li_container = target.closest('.docsContainer');


            $.ajax({
                url : '/documents/list/'+temp_id,
                success : function(response){
                    //var documents = response.documents;
                    li_container.find('#groupedDoc_'+temp_id).html(self.docListTemp({data : response}));
                }
            });
        },

        render: function () {
            var templates = this.groupCollection;
            this.$el.html(this.mainTemp({templates : templates}));

            return this;
        }

    });

    return View;

});