/**
 * Created by root on 12.08.15.
 */

define([
    'text!templates/tempPreview/createDocumentTemplate.html',
    'models/documentModel',
    'models/linkModel'

], function (CreateTemplate, DocModel, LinkModel) {

    var View;
    View = Backbone.View.extend({

        className   : "addItemLeft",

        initialize: function (options) {
            this.tempInfo = options.model;

            this.linkModel = new LinkModel(this.tempInfo.link_id);
            this.linkModel.on('sync', this.render, this);

            this.linkModel.fetch();
        },

        mainTemplate  : _.template(CreateTemplate),

        events : {
            "click #createButton" : "letsCreateDoc"
        },

        letsCreateDoc: function(){
            var links = this.linkModel.toJSON()[0];
            var values = {};
            var data;
            var this_el = this.$el;
            var myModel = new DocModel();

            links.linkFields.forEach(function(field){
                values[field.name] = this_el.find('#create_'+field.id).val().trim();
            });

            data = {
                template_id : this.tempInfo.id,
                values      : values
            };

            myModel.save(data,{
                success: function(){
                    alert('success');
                },
                error: function(){
                    alert('error'); //todo -error-
                }
            });
        },

        render: function () {
            var model = this.linkModel.toJSON()[0];

            this.undelegateEvents();
            this.$el.html(this.mainTemplate({
                model : model,
                tName : this.tempInfo.name
            }));
            this.delegateEvents();

            this.$el.find('#createTime').datepicker({
                dateFormat: "d M, yy",
                changeMonth: true,
                changeYear: true
            }).datepicker('setDate', new Date());

            return this;
        }

    });

    return View;

});