'use strict';

var TABLES = require('../../constants/tables');
var MESSAGES = require('../../constants/messages');
var async = require('async');

var request = require('supertest');
var expect = require('chai').expect;
var async = require('async');
var _ = require('lodash');

var badRequests = require('../../helpers/badRequests');
var notEnParamsMessage = badRequests.NotEnParams().message;

module.exports = function (db, defaults) {
    var Models = db.Models;
    var UserModel = Models.User;
    var ProfileModel = Models.Profile;

    var host = process.env.HOST;
    
    var agent = request.agent(host);
    var userAgent1 = request.agent(host);
    var userAgent2 = request.agent(host);
    
    var users = defaults.getData('users');
    var user1 = {
        email: users[0].attributes.email,
        password: defaults.password
    };
    var user2 = {
        email: users[1].attributes.email,
        password: defaults.password
    };

    describe('Test Users', function () {
    
        it('test 1', function (done) {
            done();
        });    

    });

    describe('Test session', function () {
        var url = '/signIn';

        it('User1 can loggin', function (done) {
            userAgent1
                .post(url)
                .send(user1)
                .end(function (err, res) {
                    var body;
                
                    if (err) {
                        return done(err);
                    }
                
                    expect(res.status).to.equals(200);
                
                    body = res.body;
                
                    expect(body).to.be.instanceOf(Object);
                    expect(body).to.have.property('success');
                
                    done();
                });
       });
    });
    
    describe('POST /signUp', function () {
        var url = '/signUp';

        it('User can\'t signUp without email', function (done) {
            var data = {
                password: 'xxx',
                company: 'myCompany'
            };

            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                    if (err) { 
                        return cb(err);
                    }
                
                    body = res.body;

                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include(notEnParamsMessage);

                    done();
                });

        });

        it('User can\'t signUp without password', function (done) {
            var ticks = new Date().valueOf();
            var data = {
                email: 'mail_' + ticks + '@mail.com',
                company: 'myCompany'
            };
            
            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                    if (err) {
                        return cb(err);
                    }
                
                    body = res.body;
                
                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include(notEnParamsMessage);
                
                    done();
                });
        });

        it('User can\'t signUp without company', function (done) {
            var ticks = new Date().valueOf();
            var data = {
                email: 'mail_' + ticks + '@mail.com',
                password: 'xxx'
            };
            
            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                    if (err) {
                        return cb(err);
                    }
                
                    body = res.body;
                
                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include(notEnParamsMessage);
                
                    done();
                });
        });

        //TODO ... test success signUp by valid data, test exists email
        
        it('User cant signUp with valid data', function (done) {
            var ticks = new Date().valueOf();
            var data = {
                email: 'mail_' + ticks + '@mail.com',
                password: 'xxx',
                company: 'myCompany'
            };
            
            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                var body;
                if (err) {
                        return cb(err);
                    }
                
                    body = res.body;
                
                    expect(res.status).to.equals(201);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('success');
                    expect(body.success).to.include(MESSAGES.SUCCESS_REGISTRATION_MESSAGE);
                
                    done();
                });

        });

    });

    describe('POST /signIn', function () {
        var url = '/signIn';
        
        it('Can\'t signIn without email', function (done) {
            var data = {
                email: user1.password
            };
            
            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                var body;
                
                if (err) {
                    return done(err);
                }
                
                expect(res.status).to.equals(400);
                
                body = res.body;
                
                expect(body).to.be.instanceOf(Object);
                expect(body).to.have.property('error');
                expect(body.error).to.include('Not enough incoming parameters.');
                
                done();
            });
        });

        it('Can\'t signIn without password', function (done) {
            var data = {
                email: user1.email
            };

            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                
                    if (err) {
                        return done(err);
                    }
                
                    expect(res.status).to.equals(400);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include('Not enough incoming parameters.');
                
                    done();
                });
        });

        it('Can\'t signIn with unconfirmed email', function (done) {
            var data = {
                email: 'unconfirmed@mail.com',
                password: '123456'
            };
            
            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                var body;
                
                if (err) {
                    return done(err);
                }
                
                expect(res.status).to.equals(400);
                
                body = res.body;
                
                expect(body).to.be.instanceOf(Object);
                expect(body).to.have.property('error');
                expect(body.error).to.include('Please confirm your account');
                
                done();
            });
        });

        it('Can signIn with valid email password', function (done) {
            agent
                .post(url)
                .send(user1)
                .end(function (err, res) {
                    var body;
                
                    if (err) {
                        return done(err);
                    }
                
                    expect(res.status).to.equals(200);
                
                    body = res.body;
                
                    expect(body).to.be.instanceOf(Object);
                    expect(body).to.have.property('success');
                
                    done();
                });
        });

    });
    
    describe('PUT /profile', function () {
        var url = '/profile';

        it('User can update the first_name', function (done) {
            var data = {
                first_name: 'new First Name'
            };

            async.waterfall([
                //make request:
                function (cb) {
                    userAgent1
                        .put(url)
                        .send(data)
                        .end(function (err, res) {
                            if (err) {
                                return cb();
                            }
                            expect(res.status).to.equals(200);
                            cb();
                        });
                },

                //check the database:
                function (cb) {
                    var userId = users[0].id;
                    var criteria = {
                        user_id: userId
                    };
                    
                    ProfileModel.find(criteria).exec(function (err, profileModel) {
                        var profile;

                        if (err) {
                            return cb(err);
                        }
                        
                        profile = profileModel.toJSON();
                        
                        expect(profile).to.be.instanceof(Object);
                        expect(profile).to.be.have.property('first_name');
                        expect(profile.first_name).to.equals(data.first_name);

                        cb();
                    });

                }
            ], done);
        });

        it('User can update the last_name', function (done) {
            var data = {
                last_name: 'new Last Name'
            };
            
            async.waterfall([
                //make request:
                function (cb) {
                    userAgent1
                        .put(url)
                        .send(data)
                        .end(function (err, res) {
                        if (err) {
                            return cb();
                        }
                        expect(res.status).to.equals(200);
                        cb();
                    });
                },

                //check the database:
                function (cb) {
                    var userId = users[0].id;
                    var criteria = {
                        user_id: userId
                    };
                    
                    ProfileModel.find(criteria).exec(function (err, profileModel) {
                        var profile;
                        
                        if (err) {
                            return cb(err);
                        }
                        
                        profile = profileModel.toJSON();
                        
                        expect(profile).to.be.instanceof(Object);
                        expect(profile).to.be.have.property('last_name');
                        expect(profile.last_name).to.equals(data.last_name);
                        
                        cb();
                    });

                }
            ], done);
        });

        it('User can update the company', function (done) {
            var data = {
                company: 'new company'
            };
            
            async.waterfall([
                //make request:
                function (cb) {
                    userAgent1
                        .put(url)
                        .send(data)
                        .end(function (err, res) {
                        if (err) {
                            return cb();
                        }
                        expect(res.status).to.equals(200);
                        cb();
                    });
                },

                //check the database:
                function (cb) {
                    var userId = users[0].id;
                    var criteria = {
                        user_id: userId
                    };
                    
                    ProfileModel.find(criteria).exec(function (err, profileModel) {
                        var profile;
                        
                        if (err) {
                            return cb(err);
                        }
                        
                        profile = profileModel.toJSON();
                        
                        expect(profile).to.be.instanceof(Object);
                        expect(profile).to.be.have.property('company');
                        expect(profile.company).to.equals(data.company);
                        
                        cb();
                    });

                }
            ], done);
        });

        it('User can update the phone', function (done) {
            var data = {
                phone: '123456789'
            };
            
            async.waterfall([
                //make request:
                function (cb) {
                    userAgent1
                        .put(url)
                        .send(data)
                        .end(function (err, res) {
                        if (err) {
                            return cb();
                        }
                        expect(res.status).to.equals(200);
                        cb();
                    });
                },

                //check the database:
                function (cb) {
                    var userId = users[0].id;
                    var criteria = {
                        user_id: userId
                    };
                    
                    ProfileModel.find(criteria).exec(function (err, profileModel) {
                        var profile;
                        
                        if (err) {
                            return cb(err);
                        }
                        
                        profile = profileModel.toJSON();
                        
                        expect(profile).to.be.instanceof(Object);
                        expect(profile).to.be.have.property('phone');
                        expect(profile.phone).to.equals(data.phone);
                        
                        cb();
                    });

                }
            ], done);
        });

        it('User can update the profile with valid data', function (done) {
            var data ={
                first_name: 'new first name 2',
                last_name: 'new last name 2',
                company: 'a new company',
                phone: '123456789'
            };
            
            async.waterfall([
                //make request:
                function (cb) {
                    userAgent1
                        .put(url)
                        .send(data)
                        .end(function (err, res) {
                        if (err) {
                            return cb();
                        }
                        expect(res.status).to.equals(200);
                        cb();
                    });
                },

                //check the database:
                function (cb) {
                    var userId = users[0].id;
                    var criteria = {
                        user_id: userId
                    };
                    
                    ProfileModel.find(criteria).exec(function (err, profileModel) {
                        var profile;
                        
                        if (err) {
                            return cb(err);
                        }
                        
                        profile = profileModel.toJSON();
                        
                        expect(profile).to.be.instanceof(Object);
                        expect(profile).to.be.have.property('first_name');
                        expect(profile).to.be.have.property('last_name');
                        expect(profile).to.be.have.property('company');
                        expect(profile).to.be.have.property('phone');
                        expect(profile.first_name).to.equals(data.first_name);
                        expect(profile.last_name).to.equals(data.last_name);
                        expect(profile.company).to.equals(data.company);
                        expect(profile.phone).to.equals(data.phone);
                        
                        cb();
                    });

                }
            ], done);
        });

    });
}
