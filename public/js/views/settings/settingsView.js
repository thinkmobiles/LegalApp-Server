/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/settings/settingsTemplate.html',
    'models/companyModel',
    'custom'

], function (SettingsTemp, CompModel, Custom) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        initialize: function () {
            var currentCompId = App.sessionData.get('companyId');

            this.companyModel = new CompModel({id : currentCompId});
            this.companyModel.on('sync', this.render, this);
            this.companyModel.fetch();
        },

        events : {

        },

        render: function () {
            var self = this;
            var tempCompany = self.companyModel.toJSON();

            this.$el.html(_.template(SettingsTemp)({tempCompany : tempCompany}));
            Custom.signatureLoad(self, function(result){
                self.$el.find('#compLogo').attr('src', result);
            });

            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_setting').addClass('active')
        }

    });

    return View;

});