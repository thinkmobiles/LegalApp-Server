'use strict';

var CONSTANTS = require('../../constants/index');
var TABLES = require('../../constants/tables');
var MESSAGES = require('../../constants/messages');
var PERMISSIONS = require('../../constants/permissions');
var STATUSES = require('../../constants/statuses');
var SIGN_AUTHORITY = require('../../constants/signAuthority');

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

    var knex = db.knex;
    var agent = request.agent(host);
    var superAdminAgent = request.agent(host);
    var userAgent1 = request.agent(host);
    var userAgent2 = request.agent(host);
    var adminUserAgent = request.agent(host);
    var editorUserAgent = request.agent(host);
    var baseUserAgent = request.agent(host);

    var users = defaults.getData('users');
    var user1 = {
        email: users[0].attributes.email,
        password: defaults.password
    };
    var user2 = {
        email: users[1].attributes.email,
        password: defaults.password
    };
    var editorUser = {
        email: users[3].attributes.email,
        password: defaults.password
    };
    var baseUser = {
        email: users[4].attributes.email,
        password: defaults.password
    };
    var adminUser = {
        email: users[5].attributes.email,
        password: defaults.password
    };

    describe('Test users', function () {

        describe('Test session', function () {
            var url = '/signIn';

            it('SuperAdmin can loggin', function (done) {
                var data = {
                    email: CONSTANTS.DEFAULT_SUPERADMIN_EMAIL,
                    password: CONSTANTS.DEFAULT_SUPERADMIN_PASSWORD
                };

                superAdminAgent
                    .post(url)
                    .send(data)
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

            it('Editor user can loggin', function (done) {
                editorUserAgent
                    .post(url)
                    .send(editorUser)
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

            it('Base User can loggin', function (done) {
                baseUserAgent
                    .post(url)
                    .send(baseUser)
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

            it('Admin User can loggin', function (done) {
                adminUserAgent
                    .post(url)
                    .send(adminUser)
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

            it('Can\'t signIn status DELETED', function (done) {
                var deletedUser = users[6];
                var data = {
                    email: deletedUser.attributes.email,
                    password: defaults.password
                };

                agent
                    .post(url)
                    .send(data)
                    .end(function (err, res) {
                        var body;

                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(403);

                        body = res.body;

                        expect(body).to.be.instanceOf(Object);
                        expect(body).to.have.property('error');
                        expect(body.error).to.include(MESSAGES.DELETED_ACCOUNT);

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

            it('SuperAdmin must have the sign_authority', function (done) {

                superAdminAgent
                    .get(url)
                    .end(function (err, res) {
                        var user;

                        if (err) {
                            return done(err);
                        }
                        expect(res.status).to.equals(200);
                        expect(res.body).to.be.instanceof(Object);

                        user = res.body;

                        expect(user).to.have.property('id');
                        expect(user).to.have.property('email');
                        expect(user).to.have.property('profile');
                        expect(user).to.have.property('company');
                        expect(user).to.not.have.property('password');
                        expect(user.profile).to.have.property('first_name');
                        expect(user.profile).to.have.property('last_name');
                        expect(user.profile).to.have.property('permissions');
                        expect(user.profile).to.have.property('sign_authority');
                        expect(user.profile.sign_authority).to.equals(SIGN_AUTHORITY.ENABLED);

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
                                console.log(res.body);

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

            it('Owner-User can update the permissions', function (done) {
                var data = {
                    profile: {
                        permissions: PERMISSIONS.ADMIN
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
                            expect(profile).to.be.have.property('permissions');
                            expect(profile.permissions).to.equals(data.profile.permissions);

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

            it('Editor User can\'t change the profile.permissions to admin', function (done) {
                var data = {
                    profile: {
                        first_name: 'new first name',
                        last_name: 'new last name',
                        permissions: PERMISSIONS.OWNER
                    }
                };

                editorUserAgent
                    .put(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(403);
                        done();
                    });

            });

            it('Base User can\'t change the permissions', function (done) {
                var data = {
                    profile: {
                        first_name: 'new first name',
                        last_name: 'new last name',
                        permissions: PERMISSIONS.ADMIN
                    }
                };

                baseUserAgent
                    .put(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(403);
                        done();
                    });

            });

            it('Admin User can\'t change the permissions to owner', function (done) {
                var data = {
                    profile: {
                        first_name: 'new first name',
                        last_name: 'new last name',
                        permissions: PERMISSIONS.OWNER
                    }
                };

                adminUserAgent
                    .put(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(403);
                        done();
                    });

            });

            it('Editor user can\'t update profile with sign_authority', function (done) {
                var data = {
                    profile: {
                        sign_authority: SIGN_AUTHORITY.ENABLED
                    }
                };

                editorUserAgent
                    .put(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        console.log(res.body.error);
                        expect(res.status).to.equals(403);
                        done();
                    });

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
                    companyId: 2
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
                        expect(userModels.models).to.have.length(6);

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
                        expect(res.body).to.have.length(6);

                        done();
                    });
            });

        });

        describe('GET /clients', function () {
            var url = '/clients';

            it('SuperAdmin can get the list of clients', function (done) {
                var superAdminId = 1;

                async.waterfall([

                    //make query:
                    function (cb) {
                        knex(TABLES.USERS)
                            .innerJoin(TABLES.USER_COMPANIES, TABLES.USERS + '.id', TABLES.USER_COMPANIES + '.user_id')
                            .where(TABLES.USER_COMPANIES + '.company_id', '<>', superAdminId)
                            .exec(function (err, rows) {
                                if (err) {
                                    return cb(err);
                                }
                                console.log(rows);
                                cb(null, rows);
                            });
                    },

                    //make request:
                    function (clients, cb) {
                        superAdminAgent
                            .get(url)
                            .end(function (err, res) {
                                if (err) {
                                    return cb(err);
                                }
                                done(null, clients, res);
                            });
                    }

                ], function (err, clients, res) {
                    if (err) {
                        return done(err);
                    }

                    console.log(clients);

                    expect(res.status).to.equals(200);
                    expect(res.body).to.be.instanceof(Array);
                    expect(res.body).to.have.length(clients.length);

                    done();
                });
            });
        });

        describe('GET /users/:id', function () {
            var url = '/users';

            it('Admin can get the user by id', function (done) {
                var userId = 4;
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
                        expect(res.body.profile).to.have.property('first_name');
                        expect(res.body.profile).to.have.property('last_name');
                        expect(res.body.profile).to.have.property('permissions');
                        expect(res.body.profile).to.have.property('sign_authority');
                        expect(res.body.id).to.equals(userId);

                        done();
                    });
            });

            it('Another Admin can\'t get the user by id', function (done) {
                var userId = 4;
                var getUrl = url + '/' + userId;

                userAgent2
                    .get(getUrl)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(400);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.have.property('error');
                        expect(res.body.error).to.include('Not Found');

                        done();
                    });
            });

        });

        describe('PUT /users/:id', function () {
            var url = '/users';

            it('Editor user can\'t update the other users profile', function (done) {
                var data = {
                    profile: {
                        first_name: 'new first name',
                        last_name: 'new last name',
                        permissions: PERMISSIONS.USER
                    }
                };
                var updateUrl = url + '/' + 1;

                editorUserAgent
                    .put(updateUrl)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(403);
                        done();
                    });
            });

            it('Admin can\'t update the permissions to owner', function (done) {
                var data = {
                    profile: {
                        first_name: 'new first name',
                        last_name: 'new last name',
                        permissions: PERMISSIONS.OWNER
                    }
                };
                var updateUrl = url + '/' + 6;

                adminUserAgent
                    .put(updateUrl)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(403);
                        done();
                    });
            });

            it('Admin can update the users status to DELETED', function (done) {
                var userId = 6;
                var data = {
                    status: STATUSES.DELETED
                };
                var updateUrl = url + '/' + userId;

                adminUserAgent
                    .put(updateUrl)
                    .send(data)
                    .end(function (err, res) {
                        var userModel;

                        if (err) {
                            return done();
                        }
                        expect(res.status).to.equals(200);

                        userModel = res.body.user;
                        expect(userModel).to.have.property('id');
                        expect(userModel).to.have.property('status');
                        expect(userModel.id).to.equals(userId);
                        expect(userModel.status).to.equals(data.status);

                        done();
                    });
            });

            it('Admin can update the signAuthority to ENABLED', function (done) {
                var userId = 6;
                var data = {
                    profile: {
                        sign_authority: SIGN_AUTHORITY.ENABLED
                    }
                };
                var updateUrl = url + '/' + userId;

                superAdminAgent
                    .put(updateUrl)
                    .send(data)
                    .end(function (err, res) {
                        var userModel;

                        if (err) {
                            return done();
                        }
                        console.log(res.body.error);

                        expect(res.status).to.equals(200);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.be.have.property('success');

                        userModel = res.body.user;

                        expect(userModel).to.have.property('id');
                        expect(userModel.id).to.equals(userId);
                        expect(userModel).to.have.property('profile');
                        expect(userModel.profile).to.have.property('sign_authority');
                        expect(userModel.profile.sign_authority).to.equals(data.profile.sign_authority);

                        done();
                    });
            });

            it('Admin can update the signAuthority to DISABLED', function (done) {
                var userId = 6;
                var data = {
                    profile: {
                        sign_authority: SIGN_AUTHORITY.DISABLED
                    }
                };
                var updateUrl = url + '/' + userId;

                superAdminAgent
                    .put(updateUrl)
                    .send(data)
                    .end(function (err, res) {
                        var userModel;

                        if (err) {
                            return done();
                        }
                        console.log(res.body.error);

                        expect(res.status).to.equals(200);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.be.have.property('success');

                        userModel = res.body.user;

                        expect(userModel).to.have.property('id');
                        expect(userModel.id).to.equals(userId);
                        expect(userModel).to.have.property('profile');
                        expect(userModel.profile).to.have.property('sign_authority');
                        expect(userModel.profile.sign_authority).to.equals(data.profile.sign_authority);

                        done();
                    });
            });

        });

        describe('GET /users/search', function () {
            var url = '/users/search';

            it('SuperAdmin can search users by searchTerm', function (done) {
                var getUrl = url + '?value=unconfirmed';

                superAdminAgent
                    .get(getUrl)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        console.log(res.body);
                        expect(res.status).to.equals(200);
                        expect(res.body).to.be.instanceof(Array);
                        expect(res.body.length).to.equals(1);

                        done();
                    });
            });


            it('SuperAdmin can search users by username', function (done) {
                var getUrl = url + '?value=' + CONSTANTS.DEFAULT_SUPERADMIN_FIRST_NAME + ' ' + CONSTANTS.DEFAULT_SUPERADMIN_LAST_NAME;

                superAdminAgent
                    .get(getUrl)
                    .end(function (err, res) {
                        var user;

                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(200);
                        expect(res.body).to.be.instanceof(Array);
                        expect(res.body.length).to.equals(1);

                        user = res.body[0];

                        expect(user).to.be.instanceof(Object);
                        expect(user).to.have.property('id');
                        expect(user.id).to.equals(CONSTANTS.DEFAULT_SUPERADMIN_ID);
                        expect(user).to.have.property('email');
                        expect(user.email).to.equals(CONSTANTS.DEFAULT_SUPERADMIN_EMAIL);
                        expect(user).to.have.property('profile');
                        expect(user).to.not.have.property('password');
                        expect(user.profile).to.have.property('first_name');
                        expect(user.profile).to.have.property('last_name');
                        expect(user.profile).to.have.property('phone');
                        expect(user).to.have.property('company');
                        expect(user.company).to.have.property('id');
                        expect(user.company.id).to.equals(CONSTANTS.DEFAULT_COMPANY_ID);
                        expect(user.company).to.have.property('name');
                        expect(user.company.name).to.equals(CONSTANTS.DEFAUlT_COMPANY_NAME);

                        done();
                    });
            });

        });
    });
};