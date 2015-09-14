/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/documents/docInProgressTemplate.html',
    'models/documentModel'

], function (DocTemplate, DocModel) {

    var View;

    View = Backbone.View.extend({

        events: {
            "click #closeDialog" : "closeThisDialog"
        },

        initialize: function (params) {
            var id=params.id;

            this.documentModel = new DocModel({id : id});
            this.documentModel.on('sync', this.render, this);
            this.documentModel.fetch();
        },

        closeThisDialog: function (){
            this.remove();
        },

        render: function () {
            var docInfo = this.documentModel.toJSON();

            this.undelegateEvents();
            this.$el.html(_.template(DocTemplate)({status : docInfo.status})).dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "docInProgress",
                modal: true,
                width: "600px"
            });
            this.delegateEvents();
            return this;
        }

    });
    return View;
});