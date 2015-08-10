/**
 * Created by root on 28.07.15.
 */

define([
    'text!templates/documents/documentsMainTemplate.html',
    'text!templates/documents/documentsListTemplate.html',
    'text!templates/documents/documentsGridTemplate.html'

], function (MainTemplate, ListTemplate, GridTemplate) {

    var DocView = Backbone.View.extend({

        mainTemp : _.template(MainTemplate),
        listTemp : _.template(ListTemplate),
        gridTemp : _.template(GridTemplate),

        initialize: function () {
            this.stateModel = new Backbone.Model();
            this.stateModel.set('currentVT','list');

            this.listenTo(this.stateModel, 'change:currentVT', this.renderDocs);

            this.render();
        },

        events : {
            "click .changeVT" : "changeViewType"
        },

        changeViewType: function(event){
            var target = $(event.target).data('value');

            this.stateModel.set('currentVT',target);
        },

        renderDocs : function(){
            this.documentsCollection = new Backbone.Collection();
            for (var i=1; i<=10; i++) {
                this.documentsCollection.add({
                    id   : i,
                    name : 'doc_name_'+i
                });
            }

            var docContainer = this.$el.find('#docContent');
            var coll = this.documentsCollection.toJSON();

            if (this.stateModel.get('currentVT') === 'list'){
                docContainer.html(this.listTemp({coll : coll}));
            } else {
                docContainer.html(this.gridTemp({coll : coll}));
            }
        },

        render: function () {

            this.$el.html(this.mainTemp);

            this.renderDocs();

            return this;
        }

    });

    return DocView;

});