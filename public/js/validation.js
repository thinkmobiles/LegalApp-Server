/**
 * Created by andrey on 12.06.15.
 */

define(
    function () {
        var addTaxAndValue  =  /[~.#<>\^\*₴]/i;
        var addLessonText   =  /[~<>\^\*₴]/i;


        var validateAddTaxonomy = function (validatedString) {
            return addTaxAndValue.test(validatedString);
        };

        var validateLessonText = function (validatedString) {
            return addLessonText.test(validatedString);
        };

        var errorMessages = {
            invalidAddTaxonomy  :  'Please enter correct ',
            invalidLessonText   :  'Please enter correct text for lesson.\nWithout symbols "~ < > ^ * ₴"'
        };


        var checkAddTaxonomy = function (fieldValue, fieldName) {
            var errorMsg = false;
            if(validateAddTaxonomy(fieldValue)){
                errorMsg = errorMessages.invalidAddTaxonomy + fieldName;
                return errorMsg;
            }

        };

        var checkLessonText = function (fieldValue) {
            var errorMsg = false;
            if(validateLessonText(fieldValue)){
                errorMsg = errorMessages.invalidLessonText;
                return errorMsg;
            }

        };

        return {
            checkAddTaxonomy  :  checkAddTaxonomy,
            checkLessonText   :  checkLessonText
        }
    });

