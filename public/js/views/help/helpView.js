/**
 * Created by root on 10.08.15.
 */

define([
    'text!templates/help/helpTemplate.html',
    'text!templates/help/messageItemView.html',
    'collections/messagesCollection'

], function (HelpTemp, MessItem, MessageCollection) {

    var View;
    View = Backbone.View.extend({

        el : '#wrapper',

        mainTemplate : _.template(HelpTemp),
        mesgTemplate : _.template(MessItem),

        initialize: function () {
            this.isAdmin = !+App.sessionData.get('permissions');
            this.render();

            this.helpCollection = new MessageCollection({
                isAdmin     : this.isAdmin,
                currentType : 'helpMe'
            });

            this.contactCollection = new MessageCollection({
                isAdmin     : this.isAdmin,
                currentType : 'contactUs'
            });

            this.helpCollection.on('reset', this.renderHelpMessages, this);
            this.contactCollection.on('reset', this.renderContactMessage, this);
        },

        events : {
            "click #helpSend"         : "letsSendMail",
            "click #tabs-container a" : "changeTabs"
        },

        changeTabs : function(event){
            var target = $(event.target);
            var container = target.closest('#tabs-container');
            var container2 = this.$el.find('#tab-items');
            var n;

            container.find('.active').removeClass('active');
            target.addClass('active');

            n = container.find('li').index(target.parent());

            container2.find('.active').removeClass('active');
            container2.find('.tab-item').eq(n).addClass('active');
        },

        renderHelpMessages: function(){
            var self = this;
            var currentCollection = this.helpCollection.toJSON();
            var container = this.$el.find('#helpMessContainer').find('.mCSB_container');

            container.html('');
            if (currentCollection.length === 0){
                container.append('<p>Are no messages</p>');
            } else {
                currentCollection.forEach(function(message){
                    container.append(self.mesgTemplate(message));
                });
            }

        },

        renderContactMessage: function(){
            var self = this;
            var currentCollection = this.contactCollection.toJSON();
            var container = this.$el.find('#helpContContainer').find('.mCSB_container');

            container.html('');
            if (currentCollection.length === 0){
                container.append('<p>Are no messages</p>');
            } else {
                currentCollection.forEach(function(message){
                    container.append(self.mesgTemplate(message));
                });
            }
        },

        letsSendMail: function(){
            var self = this;
            var this_el = self.$el;
            var eMail = this_el.find('#helpEmail').val().trim();
            var subject = this_el.find('#helpSubject').val().trim();
            var emailText = this_el.find('#helpText').val().trim();

            var data = {
                email     : eMail,
                subject   : subject,
                emailText : emailText
            };

            $.ajax({
                url  : '/helpMe',
                type : 'POST',
                data :  data,
                success : function(){
                    alert('Your message was sent successfully');
                },
                error: function(err) {
                    self.errorNotification(err);
                }
            });
        },

        render: function () {
            this.$el.html(this.mainTemplate);

            this.$el.find('#helpMessContainer').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                setHeight           : 680
            });

            this.$el.find('#helpContContainer').mCustomScrollbar({
                theme               :"dark",
                alwaysShowScrollbar : 2,
                autoHideScrollbar   : true,
                scrollInertia       : 0,
                setHeight           : 680
            });

            return this;
        },

        afterRender: function (){
            var navContainer = $('.sidebar-menu');
            navContainer.find('.active').removeClass('active');
            navContainer.find('#nav_help').addClass('active')
        }

    });

    return View;

});