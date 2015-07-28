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

    var users = defaults.getData('users');
    var user1 = {
        email: users[0].attributes.email,
        password: defaults.password
    };
    var user2 = {
        email: users[1].attributes.email,
        password: defaults.password
    };

    describe('Test templates', function () {

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

        describe('POST /templates', function () {
            var url = '/templates';

            it('Can\'t create template without name', function (done) {
                var data = {
                    link_id: 1
                };

                userAgent1
                    .post(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(201);

                        done();
                    });

            });

        });

    });
};
