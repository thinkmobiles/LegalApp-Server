'use strict';

var TABLES = require('../constants/tables');
var BUCKETS = require('../constants/buckets');

module.exports = function (PostGre, ParentModel) {
    var UserModel = ParentModel.extend({
        tableName: TABLES.USERS,
        hidden: ['password', 'confirm_token', 'forgot_token'],

        profile: function () {
            return this.hasOne(PostGre.Models.Profile);
        },

        company: function () {
            return this.belongsToMany(PostGre.Models.Company, 'owner_id')
                .through(PostGre.Models.UserCompanies, 'user_id', 'company_id');
        },

        avatar: function() {
            return this.morphOne(PostGre.Models.Image, 'imageable');
        },

        toJSON: function () {
            var attributes;
            var avatar;
            var avatarKey;
            var avatarName;
            var bucket = BUCKETS.AVATARS;
            var imageUrl;

            attributes = ParentModel.prototype.toJSON.call(this);

            if (attributes.id && this.relations && this.relations.avatar) {
                avatar = this.relations.avatar;

                if (avatar.id && avatar.attributes.key && avatar.attributes.name) {
                    avatarName = avatar.attributes.name;
                    avatarKey = avatar.attributes.key;
                    imageUrl = PostGre.Models.Image.getImageUrl(avatarName, avatarKey);
                }

                attributes.avatar = {
                    url: imageUrl
                };
            }
            return attributes;
        }

    }, {
        getCollaborators: function (queryOptions) {
            var page;
            var limit;
            var orderBy;
            var order;
            var userId;
            var companyId;

            if (queryOptions && queryOptions.companyId) {
                companyId = queryOptions.companyId;
            }

            if (queryOptions && queryOptions.userId) {
                userId = queryOptions.userId;
            }

            return this
                .query(function (qb) {
                    qb.innerJoin(TABLES.USER_COMPANIES, 'users.id', 'user_companies.user_id');

                    if (userId) {
                        qb.andWhere('users.id', userId);
                    }

                    if (companyId) {
                        qb.andWhere('user_companies.company_id', companyId);
                    }

                    qb.select('users.*');
                });
        },

        findCollaborator: function (queryOptions, fetchOptions) {
            return this.getCollaborators(queryOptions)
                .fetch(fetchOptions);
        },

        findCollaborators: function (queryOptions, fetchOptions) {
            return this.getCollaborators(queryOptions)
                .fetchAll(fetchOptions);
        }

    });

    return UserModel;
};