'use strict';

var badRequests = require('../helpers/badRequests');
var mammoth = require('../helpers/mammoth');

var MammothHandler = function () {
    var mammothOptions = {
        styleMap: [
            "p.Center => p.center:fresh",
            "p.Both => p.both:fresh",
            "p.Left => p.left:fresh",
            "p.Right => p.right:fresh",
            "p.BreakPage => p.breakPage:fresh"
        ],
        transformDocument: transformElement
    };


    function transformElement(element) {
        if (element.children) {
            element.children.forEach(transformElement);
        }
        if (element.type === "paragraph") {
            if (element.alignment === "center" && !element.styleId) {
                element.styleId = "Center";
            }
        }
        if (element.type === "paragraph") {
            if (element.alignment === "both" && !element.styleId) {
                element.styleId = "Both";
            }
        }
        if (element.type === "paragraph") {
            if (element.alignment === "left" && !element.styleId) {
                element.styleId = "Left";
            }
        }
        if (element.type === "paragraph") {
            if (element.alignment === "right" && !element.styleId) {
                element.styleId = "Right";
            }
        }
        if (element.type === "paragraph" && !element.styleId) {
            if (element.children[0] && element.children[0].children[0].type === "pageBreak") {
                element.styleId = "BreakPage";
            }
        }
        return element;
    }

    this.docx2html = function(converterParams, callback){
        mammoth
            .convertToHtml(converterParams, mammothOptions)
            .then(function (result) {
                var messages = result.messages; // Any messages, such as warnings during conversion
                var htmlContent;

                if (messages && messages.length) {
                    console.error(messages);
                }

                htmlContent = result.value; // The generated HTML

                callback(htmlContent);
            })
            .done();
    };


    //TODO: delete this function and route after testing
    this.docxToHtml = function (req, res, next) {
        var path = req.body.path || "public/uploads/development/docx/testdocx3.docx";
        var fields = {
            //name:code all posible fields from linkFields table
            first_name: '{first_name}',
            last_name: '{last_name}',             //TODO clear/change this all after debug
            email: '{email}',
            birthday: '{birthday}',
            phone: '{phone}'
        };
        var values = {
            //name:value (data from chosen Employee)
            first_name: 'Petro',            //keys and values that contains in template
            last_name: 'Petrovich'
        };

        mammoth.convertToHtml({path: path}, mammothOptions)
            .then(function (result) {
                var html = result.value; // The generated HTML
                var messages = result.messages; // Any messages, such as warnings during conversion

                console.log(messages);

                res.status(200).send(html);

               /* if (html) {
                    //try to create html with values from html template
                    templateHandler.createDocument(html, fields, values, function (err, newHtml) {
                        if (err) {
                            res.status(200).send('Can\'t paste values to html');
                        } else {
                            res.status(200).send(newHtml); //all right
                        }
                    });
                } else {
                    res.status(200).send('Can\'t convert docx to html');
                }*/
            })
            .done();
    };


};

module.exports = MammothHandler;