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
            "click #helpSend" : "letsSendMail"
        },

        renderHelpMessages: function(){
            var self = this;

            //++++++++++++++++++++++++
            for (var i=1; i<=5; i+=1){
                this.helpCollection.add({
                    id      : i,
                    subject : 'my '+i+'-ij Subject',
                    text    : 'erghfsdvbryhfvyudgvyudfgvdfbvytvjdfcbvydgdmhlgfbyufvbnbgfujbybjvbnuhbfgnb gbio tghiuty ttguh urtgfbhuighdfvu thuhbnuhbiovjt ighbuighb ohbkvnb bvj gbl ghb sighbg g'
                });
            }
            //++++++++++++++++++++++++

            var currentCollection = this.helpCollection.toJSON();
            var container = this.$el.find('#helpMessContainer').find('.mCSB_container');

            currentCollection.forEach(function(message){
                container.append(self.mesgTemplate(message));
            });

        },

        renderContactMessage: function(){
            var self = this;

            //++++++++++++++++++++++++
            for (var i=1; i<=5; i+=1){
                this.contactCollection.add({
                    id      : i,
                    subject : 'my '+i+'-ij Subject',
                    text    : 'erghfsdvbryhfvyudgvyudfgvdfbvytvjdfcbvydgdmhlgfbyufvbnbgfujbybjvbnuhbfgnb gbio tghiuty ttguh urtgfbhuighdfvu thuhbnuhbiovjt ighbuighb ohbkvnb bvj gbl ghb sighbg g'
                });
            }
            //++++++++++++++++++++++++

            var currentCollection = this.contactCollection.toJSON();
            var container = this.$el.find('#helpContContainer').find('.mCSB_container');

            currentCollection.forEach(function(message){
                container.append(self.mesgTemplate(message));
            });

        },

        letsSendMail: function(){
            var this_el = this.$el;
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