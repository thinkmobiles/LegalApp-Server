/**
 * Created by root on 11.08.15.
 */

define([
    'text!templates/tempPreview/tempPreviewTemplate.html',
    'models/templateModel'

], function (PreviwTemp, TempModel) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        currentTemp : _.template(PreviwTemp),

        initialize: function (options) {
            this.tempId =options.id;

            this.stateModel = new TempModel({id : this.tempId});

            this.render();
        },

        events : {

        },

        findPreview: function(){
            var id = this.tempId;
            var myDocContainer = this.$el.find('#previewContainer');

            $.ajax({
                url  : '/templates/'+id+'/preview',
                type : 'GET',
                success : function(response){
                    myDocContainer.html(response);
                },
                error : function(){
                    alert('error'); //todo
                }
            });

        },

        render: function () {
            this.$el.html(this.currentTemp);

            this.findPreview();

            return this;
        }

    });

    return View;

});