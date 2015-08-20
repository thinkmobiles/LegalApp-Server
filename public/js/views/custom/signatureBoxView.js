/**
 * Created by andrey on 31.07.15.
 */

define([
    'text!templates/custom/signatureBoxTemplate.html'
], function (SignatureTemplate) {

    var SignatureView;
    SignatureView = Backbone.View.extend({

        initialize: function () {
            this.drawAction = false;

            this.render();
        },

        events : {
            "click #testDraw"      : "drowOnCanvas",
            "click #cancelCanvas"  : "cancelCanvas",
            "click #saveCanvas"    : "saveCanvas",
            "mousedown #myCanvas"  : "turnOnDraw",
            "mouseup #myCanvas"    : "turnOffDraw",
            "mousemove #myCanvas"  : "drawOnMove"
        },

        /*canvas initialization*/
        drowOnCanvas : function(){
            this.canvas = this.$el.find('#myCanvas')[0];

            if (this.canvas.getContext) {
                this.canvasContext = this.canvas.getContext("2d");
            }
        },

        /*draw line when mouse is in move*/
        drawOnMove : function (event){
            var x, y;
            var context = this.canvasContext;

            if (this.drawAction) {
                x = event.offsetX;
                y = event.offsetY;


                context.lineTo(x,y);
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.stroke();
            }
        },

        /*start draw, when you click down mouse button*/
        turnOnDraw : function (event) {
            var x, y;
            var context = this.canvasContext;

            this.drawAction = true;
            x = event.offsetX;
            y = event.offsetY;

            context.moveTo(x, y);
            context.lineTo(x + 2, y + 2);
            context.stroke();
        },

        /*stop draw, when you click up mouse button*/
        turnOffDraw : function (){
            this.drawAction = false
        },

        /*close signature form*/
        cancelCanvas : function(){
            this.remove();
        },

        /*save current signature*/
        saveCanvas : function(){
            var mySignature = this.canvas.toDataURL("image/png");
            this.trigger('iAccept', mySignature);
        },

        render: function () {
            var self = this;
            this.$el.html(_.template(SignatureTemplate)).dialog({
                closeOnEscape: false,
                autoOpen: true,
                dialogClass: "canvasDialog",
                modal: true,
                width: "600px",
                close : function(){
                    self.remove()
                }
            });

            this.drowOnCanvas();

            return this;
        }

    });

    return SignatureView;

});