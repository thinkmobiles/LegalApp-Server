'use strict';

var BUCKETS = require('../constants/buckets');
var CONSTANTS = require('../constants/index');
var STATUSES = require('../constants/statuses');
var TABLES = require('../constants/tables');

module.exports = function (PostGre, ParentModel) {
    var UserModel = ParentModel.extend({
        tableName: TABLES.USERS,
        hidden: ['password', 'confirm_token', 'forgot_token'],

        profile: function () {
            return this.hasOne(PostGre.Models.Profile);
        },

        company: function () {
            return this.belongsToMany(PostGre.Models.Company)
                .through(PostGre.Models.Profile, 'user_id', 'company_id');
        },

        avatar: function() {
            return this.morphOne(PostGre.Models.Image, 'imageable');
        },

        signature: function () {
            return this.hasOne(PostGre.Models.SecretKey, 'user_id');
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
                } else {
                    imageUrl = PostGre.Models.Image.uploader.getFileUrl(CONSTANTS.DEFAULT_AVATAR_URL, bucket);
                }

                attributes.avatar = {
                    url: imageUrl
                };
            }

            if (attributes.id && this.relations && this.relations.company && this.relations.company.length) {
                attributes.company = [this.relations.company.models[0]];
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
            var withoutCompany;

            if (queryOptions && queryOptions.companyId) {
                companyId = queryOptions.companyId;
            }

            if (queryOptions && queryOptions.userId) {
                userId = queryOptions.userId;
            }

            if (queryOptions && queryOptions.withoutCompany) {
                withoutCompany = queryOptions.withoutCompany;
            }

            return this
                .query(function (qb) {
                    //qb.innerJoin(TABLES.USER_COMPANIES, TABLES.USERS + '.id', TABLES.USER_COMPANIES + '.user_id');
                    qb.innerJoin(TABLES.PROFILES, TABLES.USERS + '.id', TABLES.PROFILES + '.user_id');

                    if (userId) {
                        qb.andWhere(TABLES.USERS + '.id', userId);
                    }

                    if (companyId) {
                        //qb.andWhere(TABLES.USER_COMPANIES + '.company_id', companyId);
                        qb.andWhere(TABLES.PROFILES + '.company_id', companyId);
                    }

                    if (withoutCompany) {
                        //qb.andWhere(TABLES.USER_COMPANIES + '.company_id', '<>', withoutCompany);
                        qb.andWhere(TABLES.PROFILES + '.company_id', '<>', withoutCompany);
                    }

                    qb.select(TABLES.USERS + '.*');
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