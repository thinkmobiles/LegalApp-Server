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
    var TemplateModel = Models.Template;

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

                        expect(res.status).to.equals(400);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.have.property('error');
                        expect(res.body.error).to.include(notEnParamsMessage);

                        done();
                    });
            });

            it('Can\'t create template without link_id', function (done) {
                var data = {
                    name: 'Test template'
                };

                userAgent1
                    .post(url)
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        expect(res.status).to.equals(400);
                        expect(res.body).to.be.instanceof(Object);
                        expect(res.body).to.have.property('error');
                        expect(res.body.error).to.include(notEnParamsMessage);

                        done();
                    });
            });

            it('Can create template with valid data', function (done) {
                var data = {
                    name: 'My first Template',
                    link_id: 1
                };

                async.waterfall([

                    //make request:
                    function (cb) {
                        userAgent1
                            .post(url)
                            .send(data)
                            .end(function (err, res) {
                                if (err) {
                                    return cb(err);
                                }

                                expect(res.status).to.equals(201);
                                expect(res.body).to.be.instanceof(Object);
                                expect(res.body).to.have.property('success');
                                expect(res.body).to.have.property('model');

                                cb(null, res.body.model);
                            });
                    },

                    //check database
                    function (template, cb) {
                        var criteria = {};

                        expect(template).to.be.instanceof(Object);
                        expect(template).to.have.property('id');
                        expect(template).to.have.property('name');
                        expect(template).to.have.property('link_id');

                        expect(template.name).to.equals(data.name);
                        expect(template.link_id).to.equals(data.link_id);

                        criteria.id = template.id;
                        TemplateModel
                            .find(criteria)
                            .exec(function (err, templateModel) {
                                var templateJSON;

                                if (err) {
                                    return cb(err);
                                }

                                expect(templateModel).to.be.instanceof(Object);

                                templateJSON = templateModel.toJSON();

                                expect(templateJSON).to.have.property('id');
                                expect(templateJSON).to.have.property('company_id');

                                expect(templateJSON.name).to.equals(data.name);
                                expect(templateJSON.link_id).to.equals(data.link_id);
                                expect(templateJSON.company_id).to.equals(1);

                                cb();
                            });

                    }

                ], function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
            });
        });

        describe('GET /templates', function () {
            var url = '/templates/';

            it('Admin can get the list of templates', function (done) {

                async.waterfall([

                    //make request:
                    function (cb) {
                        userAgent1
                            .get(url)
                            .end(function (err, res) {
                                if (err) {
                                    return cb(err);
                                }

                                console.log(res.body.stack);
                                console.log(res.body.error);

                                expect(res.status).to.equals(200);
                                expect(res.body).to.be.instanceof(Array);
                                expect(res.body).to.have.property('length');
                                expect(res.body.length).to.equals(3);

                                cb(null, res.body);
                            });
                    },

                    //check database
                    function (template, cb) {
                        cb(); //TODO: write some test
                    }

                ], function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });

            });

        });

    });
};
