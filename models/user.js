'use strict';

var TABLES = require('../constants/tables');

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
        
        //collaborators: function () {
        //    var company = this.related('company');
        //    var companyId = (company && company.id) ? company.id : 1; 
            
        //    return this.belongsToMany(PostGre.Models.User, 'id')
        //        .query(function (qb) {
        //            qb.innerJoin(TABLES.USER_COMPANIES, 'user_companies.user_id', 'users.id')
        //                .where({
        //                "user_companies.company_id": companyId
        //            });
        //        });
            
    }, {
        findCollaborators: function (queryOptions, fetchOptions) {
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
                    qb.innerJoin('user_companies', 'users.id', 'user_companies.user_id');
                
                    if (userId) {
                        qb.andWhere('users.id', '<>', userId);
                    }
                
                    if (companyId) { 
                        qb.andWhere('user_companies.company_id', companyId);
                    }

                    qb.select('users.*');
                })
                .fetchAll(fetchOptions);
        }
    
    });

    return UserModel;
};