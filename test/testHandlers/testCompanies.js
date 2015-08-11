'use strict';

var TABLES = require('../../constants/tables');
var MESSAGES = require('../../constants/messages');
var PERMISSIONS = require('../../constants/permissions');

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

    describe('Test companies', function () {

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

        describe('POST /companies', function () {
            var url = '/companies';

            it('Can\'t create company without name', function (done) {
                var data = {};

                adminUserAgent
                    .post(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(400);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.be.have.property('error');
                        expect(res.body.error).to.include(notEnParamsMessage);

                        done();
                    });
            });

            it('Admin Cant create the company by valid data', function (done) {
                var data = {
                    name: 'myTestCompany'
                };

                adminUserAgent
                    .post(url)
                    .send(data)
                    .end(function (err, res) {
                        var companyModel;

                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(201);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.be.have.property('success');
                        expect(res.body).to.be.have.property('model');

                        companyModel = res.body.model;

                        expect(companyModel).to.be.instanceof(Object);
                        expect(companyModel).to.have.property('id');
                        expect(companyModel).to.have.property('name');
                        expect(companyModel.name).to.equals(data.name);

                        done();
                    });
            });

        });
    });
};