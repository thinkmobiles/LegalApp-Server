/**
 * Created by kille on 28.07.2015.
 */
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
    var links = defaults.getData('links');
    var link1 = {
        name: links[0].attributes.name,
        company_id: links[0].attributes.company_id

    };
    var link2 = {
        name: links[1].attributes.name,
        company_id: links[1].attributes.company_id

    };
    var link3 = {
        name: links[2].attributes.name,
        company_id: links[2].attributes.company_id

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

    describe('Test creation links', function(){
        var url = '/links';

        it('Create link1', function (done) {
            userAgent1
                .post(url)
                .send(link1)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(201);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);
                    expect(body).to.have.property('success');
                    expect(body).to.have.property('model');

                    done();
                });
        });
    });

    describe('Test updste link by id', function(){
        var url = '/links/4';
        var newLink = {
            name: 'link 4',
            company_id:2
        };

        it('Update link1 to link4 by id 4', function (done) {
            userAgent1
                .put(url)
                .send(newLink)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);
                    expect(body).to.have.property('success');
                    expect(body).to.have.property('model');

                    done();
                });
        });
    });

    describe('Test updste link by id when User is Unauthorized', function(){
        var url = '/links/4';
        var newLink = {
            name: 'hasNoPermissions'
        };

        it('Try update link 4 to hasNoPermissions by id 4', function (done) {
            agent
                .put(url)
                .send(newLink)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(401);

                    done();
                });
        });
    });

    describe('GET links by company_id from session', function(){
        var url = '/links/';

        it('GET links by company_id = 1', function (done) {
            userAgent1
                .get(url)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);

                    body = res.body;

                    expect(body).to.be.instanceOf(Array);

                    done(null, body);
                });
        });
    });

    describe('GET /links when unathorized', function(){
        var url = '/links/';

        it('Try to GET links ', function (done) {
            agent
                .get(url)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(401);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);

                    done(null, body);
                });
        });
    });


};
