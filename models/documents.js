'use strict';

var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

var badRequests = require('../helpers/badRequests');
var tokenGenerator = require('../helpers/randomPass');

module.exports = function (PostGre, ParentModel) {
    var DocumentModel = ParentModel.extend({
        tableName: TABLES.DOCUMENTS,
        hidden: ['access_token', 'html_content'/*, 'created_at', 'updated_at'*/],

        template: function () {
            return this.belongsTo(PostGre.Models.Template);
        },

        company: function () {
            return this.belongsTo(PostGre.Models.Company);
        },

        assignedUser: function () {
            return this.belongsTo(PostGre.Models.User, 'assigned_id');
        },

        user: function () {
            return this.belongsTo(PostGre.Models.User, 'user_id');
        },

        checkAccessToSignature: function (userModel, callback) {
            var attributes = this.attributes;
            var status = attributes.status;
            var profileModel;
            var signAuthority;

            if (!userModel || !userModel.related('profile')) {
                return callback(badRequests.NotEnParams({reqParams: 'userModel'}));
            }

            if (userModel && userModel.related('profile')) {
                profileModel = userModel.related('profile');
            } else {
                return callback(badRequests.NotEnParams({reqParams: 'userModel.related("profile")'}));
            }

            signAuthority = profileModel.get('sign_authority');

            if (status === STATUSES.CREATED || status === STATUSES.SENT_TO_SIGNATURE_COMPANY) {
                if (!signAuthority) {
                    return callback(badRequests.AccessError('Can\'t have sign authority'));
                }

                if ((status === STATUSES.SENT_TO_SIGNATURE_CLIENT) && (attributes.assigned_id !== userModel.id)) {
                    if (!signAuthority) {
                        return callback(badRequests.AccessError('Can\'t have sign access to this document'));
                    }
                }

            }

            callback(null, true);
        },

        prepareToSend: function (userId, callback) {
            var documentModel = this;
            var attributes = this.attributes;
            var status = attributes.status;
            var now = new Date();
            var saveData;

            //if ((status === STATUSES.SENT_TO_SIGNATURE_COMPANY) || (status === STATUSES.CREATED)) {
            if (status === STATUSES.CREATED) {
                saveData = {
                    assigned_id: userId,
                    status: STATUSES.SENT_TO_SIGNATURE_COMPANY, //new status
                    sent_to_company_at: now,
                    access_token: tokenGenerator.generate()
                };

            } else if (status === STATUSES.SENT_TO_SIGNATURE_CLIENT) {
                saveData = {
                    status: STATUSES.SIGNED_BY_CLIENT, //new status
                    client_signed_at: now,
                    access_token: null
                };

            } else {
                return callback(badRequests.AccessError({message: 'Incorrect status'})); //never enter this code (need some fix)
            }

            documentModel
                .save(saveData, {patch: true})
                .exec(callback);
        },

        saveSignature: function (userId, imageSrc, callback) {
           /* var profileModel;
            var signAuthority;*/
            var documentModel = this;
            var attributes = this.attributes;
            var htmlContent = attributes.html_content;
            var status = attributes.status;
            var clientSignature = '{client_signature}';
            var companySignature = '{company_signature}';
            var replaceValue = '<img src=' + imageSrc + '>';
            var searchValue;
            var saveData;
            var now = new Date();

            if (!documentModel || !documentModel.id) {
                return; //TODO: send error
            }

            /*if (!userModel || !userModel.related('profile')) {
                return callback(badRequests.NotEnParams({reqParams: 'userModel'}));
            }

            if (userModel && userModel.related('profile')) {
                profileModel = userModel.related('profile');
            } else {
                return callback(badRequests.NotEnParams({reqParams: 'userModel.related("profile")'}));
            }

            signAuthority = profileModel.get('sign_authority');*/

            if ((status === STATUSES.SENT_TO_SIGNATURE_COMPANY) || (status === STATUSES.CREATED)) {
                searchValue = companySignature;
                saveData = {
                    assigned_id: userId,
                    status: STATUSES.SENT_TO_SIGNATURE_CLIENT, //new status
                    company_signed_at: now,
                    access_token: tokenGenerator.generate(),
                    sent_to_client_at: now
                };

            } else if (status === STATUSES.SENT_TO_SIGNATURE_CLIENT) {
                searchValue = clientSignature;
                saveData = {
                    status: STATUSES.SIGNED_BY_CLIENT, //new status
                    client_signed_at: now,
                    access_token: null
                };

            } else {
                return callback(badRequests.AccessError()); //never enter this code (need some fix)
            }

            htmlContent = htmlContent.replace(new RegExp(searchValue, 'g'), replaceValue);
            saveData.html_content = htmlContent;

            documentModel
                .save(saveData, {patch: true})
                .exec(callback);
        }


    });

    return DocumentModel;
};