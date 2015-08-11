/**
 * Created by kille on 07.08.2015.
 */
'use strict';

var badRequests = require('../helpers/badRequests');
var mammoth = require("mammoth");
var TemplateHandler = require('../handlers/templates');

var MammothHandler = function (PostGre) {
    var templateHandler = new TemplateHandler(PostGre);
    var Models = PostGre.Models;
    var linkFields = Models.LinkFields;
    //var LinksModel = Models.Links;
    //var linkFieldsHandler = new LinkFieldHandler(PostGre);
    //var self = this;

    this.docxToHtml = function (req, res, next) {
        var path = req.body.path || "public/uploads/development/docx/testdocx1.docx";
        var fields = {
            //name:code all posible fields from linkFields table
            first_name: '{first_name}',
            last_name: '{last_name}',             //TODO clear/change this all after debug
            email: '{email}',
            birthday: '{birthday}',
            phone: '{phone}'
        };
        var values = {
            //name:value
            first_name: 'Petro',            //keys and values that contains in template
            last_name: 'Petrovich'
        };
        //var companyId = req.session.companyId || 1;
        //var linkId = 28;

       /* //find which codes are in our linkFields table for link with linkId | put in async
        linkFields
            .forge()
            .where({link_id:linkId})
            .fetchAll({require:true})
            .then(function(fieldsModels){
                var fieldsToJSON = fieldsModels.toJSON();

                //build fields for next step as {name:code} object
                for (var i = fieldsToJSON.length; i>0; i-- ){
                    fields[fieldsToJSON[i-1].name] = fieldsToJSON[i-1].code
                }
            })
            .catch(linkFields.NotFoundError, function(err){
                next(badRequests.NotFound());
            })
            .catch(next);*/


        //convert docx to html
        mammoth.convertToHtml({path: path})
            .then(function (result) {
                var html = result.value; // The generated HTML
                //var messages = result.messages; // Any messages, such as warnings during conversion

                if (html) {
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
                }
            })
            .done();
    };


};

module.exports = MammothHandler;