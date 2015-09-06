/**
 * Created by andrey on 21.07.15.
 */

define([
    'text!templates/docInProgress/docInProgressTemplate.html',
    'models/documentModel'

], function (DocTemplate, DocModel) {

    var View;

    View = Backbone.View.extend({

        el : '#wrapper',

        events: {
            //"click #confirmButton" : "goToLogin"
        },

        initialize: function (params) {
            var id=params.id;

            this.documentModel = new DocModel({id : id});
            this.documentModel.on('sync', this.render, this);
            this.documentModel.fetch();
        },

        render: function () {
            var docInfo = this.documentModel.toJSON();

            this.$el.html(_.template(DocTemplate)(docInfo));
            return this;
        }

    });
    return View;
});