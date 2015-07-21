'use strict';

var factory = require('factory-girl');
var crypto = require('crypto');
var PASSWORD = '123456';

module.exports = function (PostGre) {
    var Models = PostGre.Models;
    var Collections = PostGre.Collections;
    var User = Models.User;
    var Profile = Models.Profile;

    var data = [];
    var emailCounter = 1;
    
    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };
   
    
    // define a factory using define()
    //factory.define('users', User, {
    //    // define attributes using properties
    //    //state: 'active',
        
    //    password: getEncryptedPass(PASSWORD),

    //    // ...or functions
    //    email: function () {
    //        emailCounter++;
    //        return 'user_' + emailCounter + '_@test.com';
    //    }//,
    //    // provide async functions by accepting a callback
    //    //async: function (callback) {
    //    //    somethingAsync(callback);
    //    //}
    //});
    
    console.log('user', User);

    factory.define('users', User);
    
    function create() {
        //return factory.create('users', function (err, user) {
        //    console.log(user.attributes); // => {state: 'active', email: 'user1@demo.com', async: 'foo'}
        //});

        return factory.create('users', {email: 'test@mail.com'}, function (err, user) {
            console.log(user); // => {state: 'active', email: 'user1@demo.com', async: 'foo'}
        });

    };

    return {
        create: create,
        data: data
    }
};