/**
 * Created by kille on 07.08.2015.
 */
'use strict';

var badRequests = require('../helpers/badRequests');
var mammoth = require("mammoth");

var MammothHandler = function (PostGre) {
    //var Models = PostGre.Models;
    //var LinksModel = Models.Links;
    //var linkFieldsHandler = new LinkFieldHandler(PostGre);
    //var self = this;

    this.docxToHtml = function (req,res,next){
        var path = "public/uploads/development/docx/testdocx.docx";

        mammoth.convertToHtml({path: path})
            .then(function(result){
                var html = result.value; // The generated HTML
                var messages = result.messages; // Any messages, such as warnings during conversion

                if (html){
                    //console.dir(messages);
                    res.status(200).send(html);
                } else {
                    res.status(200).send('Can\'t convert docx to html');
                }
            })
            .done();
    };



};

module.exports = MammothHandler;