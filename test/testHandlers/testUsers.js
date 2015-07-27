'use strict';

var TABLES = require('../../constants/tables');
var MESSAGES = require('../../constants/messages');

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

        it('User2 can loggin', function (done) {
            userAgent2
                .post(url)
                .send(user2)
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
                        return done(err);
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
                        return done(err);
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
                        return done(err);
                    }

                    body = res.body;

                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include(notEnParamsMessage);

                    done();
                });
        });

        it('User cant signUp with invalid email', function (done) {
            var ticks = new Date().valueOf();
            var data = {
                email: 'foo',
                password: 'xxx',
                company: 'myCompany'
            };

            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                    if (err) {
                        return done(err);
                    }

                    body = res.body;

                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include('Incorrect');

                    done();
                });
        });

        it('User cant signUp with exists email', function (done) {
            var ticks = new Date().valueOf();
            var data = {
                email: user1.email,
                password: 'xxx',
                company: 'myCompany'
            };

            agent
                .post(url)
                .send(data)
                .end(function (err, res) {
                    var body;
                    if (err) {
                        return done(err);
                    }

                    body = res.body;

                    expect(res.status).to.equals(400);
                    expect(body).to.be.instanceof(Object);
                    expect(body).to.have.property('error');
                    expect(body.error).to.include('in use');

                    done();
                });
        });

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
                        return done(err);
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

    describe('GET /currentUser', function () {
        var url = '/currentUser';

        it('User can get the profile data', function (done) {

            async.waterfall([

                //make request:
                function (cb) {
                    userAgent1
                        .get(url)
                        .end(function (err, res) {
                            if (err) {
                                return cb(err);
                            }
                            expect(res.status).to.equals(200);
                            expect(res.body).to.be.instanceof(Object);

                            cb(null, res.body);
                        });
                },

                //check database:
                function (user, cb) {
                    var userId = users[0].id;
                    var criteria = {
                        id: userId
                    };
                    var fetchOptions = {
                        withRelated: ['profile', 'company']
                    };

                    expect(user).to.have.property('id');
                    expect(user).to.have.property('email');
                    expect(user).to.have.property('profile');
                    expect(user).to.have.property('company');
                    expect(user).to.not.have.property('password');

                    UserModel.find(criteria, fetchOptions).exec(function (err, userModel) {
                        var userJSON;

                        if (err) {
                            return cb(err);
                        }

                        userJSON = userModel.toJSON();

                        expect(user.id).to.equals(userJSON.id);
                        expect(user.email).to.equals(userJSON.email);
                        expect(user.profile.first_name).to.equals(userJSON.profile.first_name);
                        expect(user.profile.last_name).to.equals(userJSON.profile.last_name);
                        expect(user.profile.phone).to.equals(userJSON.profile.phone);
                        expect(user.company.id).to.equals(userJSON.company.id);

                        cb();
                    });

                }
            ], function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });

        });

    });

    describe('PUT /profile', function () {
        var url = '/profile';

        it('User can update the first_name', function (done) {
            var data = {
                profile: {
                    first_name: 'new First Name'
                }
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

                        expect(profile.first_name).to.equals(data.profile.first_name);

                        cb();
                    });

                }
            ], done);
        });

        it('User can update the last_name', function (done) {
            var data = {
                profile: {
                    last_name: 'new Last Name'
                }
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
                        expect(profile.last_name).to.equals(data.profile.last_name);

                        cb();
                    });

                }
            ], done);
        });

        it('User can update the phone', function (done) {
            var data = {
                profile: {
                    phone: '123456789'
                }
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
                        expect(profile.phone).to.equals(data.profile.phone);

                        cb();
                    });

                }
            ], done);
        });

        it('User can update the profile with valid data', function (done) {
            var data = {
                profile: {
                    first_name: 'new first name 2',
                    last_name: 'new last name 2',
                    phone: '123456789'
                }
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
                        expect(profile.first_name).to.equals(data.profile.first_name);
                        expect(profile.last_name).to.equals(data.profile.last_name);
                        expect(profile.phone).to.equals(data.profile.phone);

                        cb();
                    });

                }
            ], done);
        });

    });

    describe('GET /users', function () {
        var url = '/users';

        it('Collaborators', function (done) {
            var userId = users[0].id;
            var criteria = {
                id: userId
            };

            var queryOptions = {
                companyId: 1
            };
            var fetchOptions = {
                withRelated: ['profile']
            };

            UserModel
                .findCollaborators(queryOptions, fetchOptions)
                .exec(function (err, userModels) {
                    var user;

                    if (err) {
                        return done(err);
                    }

                    expect(userModels.models).to.have.property('length');
                    expect(userModels.models).to.have.length(4);

                    done();
                });
        });

        it('User can get the list of collaborators', function (done) {
            userAgent1
                .get(url)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);
                    expect(res.body).to.be.instanceof(Array);
                    expect(res.body).to.have.length(4);

                    done();
                });
        });

    });

    describe('GET /users/:id', function () {
        var url = '/users';

        it('Admin can get the user by id', function (done) {
            var userId = 3;
            var getUrl = url + '/' + userId;

            userAgent1
                .get(getUrl)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);
                    expect(res.body).to.be.instanceof(Object);
                    expect(res.body).to.have.property('id');
                    expect(res.body).to.have.property('profile');
                    expect(res.body.id).to.equals(userId);

                    done();
                });
        });

        it('Another Admin can\'t get the user by id', function (done) {
            var userId = 3;
            var getUrl = url + '/' + userId;

            userAgent2
                .get(getUrl)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    console.log(res.body);

                    expect(res.status).to.equals(400);
                    expect(res.body).to.be.instanceof(Object);
                    expect(res.body).to.have.property('error');
                    expect(res.body.error).to.include('Not Found');

                    done();
                });
        });

    });

};
