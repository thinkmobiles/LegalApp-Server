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
    var LinkModel = Models.Links;

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
    var linkFields = defaults.getData('links_fields');

    var link1 = {
        name: links[0].attributes.name,
        company_id: links[0].attributes.company_id

    };
    var link2 = {
        name: links[1].attributes.name,
        company_id: links[1].attributes.company_id,
        link_fields: [
            {
                link_id: linkFields[0].attributes.link_id,
                name: linkFields[0].attributes.name,
                code: linkFields[0].attributes.code
            },
            {
                link_id: linkFields[1].attributes.link_id,
                name: linkFields[1].attributes.name,
                code: linkFields[1].attributes.code
            },
            {
                link_id: linkFields[2].attributes.link_id,
                name: linkFields[2].attributes.name,
                code: linkFields[2].attributes.code
            }
        ]

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

    describe('Test creation links', function () {
        var url = '/links';

        it('Create link1', function (done) {


            async.waterfall([

                //create link
                function (cb) {
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

                            cb(null, body.model);
                        });

                    //check data in Database
                }, function (linkModel, cb) {
                    var linkId = linkModel.id;

                    expect(linkModel).to.be.instanceof(Object);
                    expect(linkModel).to.have.property('id');
                    expect(linkModel).to.have.property('name');
                    expect(linkModel).to.have.property('company_id');

                    expect(linkModel.name).to.equals(link1.name);

                    LinkModel
                        .find({id: linkId})
                        .exec(function (err, linkModel) {
                            var linkModelJSON;

                            if (err) {
                                return cb(err);
                            }

                            expect(linkModel).to.be.instanceof(Object);

                            linkModelJSON = linkModel.toJSON();

                            expect(linkModelJSON).to.have.property('id');
                            expect(linkModelJSON).to.have.property('name');
                            expect(linkModelJSON).to.have.property('company_id');

                            expect(linkModelJSON.name).to.equals(link1.name);
                            expect(linkModelJSON.company_id).to.equals(1);

                            cb();
                        })

                }], function (err, result) {
                if (err) {
                    return done(err);
                }
                done();
            })


        });

        it('Can\'t create link without name', function (done) {
            var linkWithoutName = {
                company_id: links[0].attributes.company_id
            };

            userAgent1
                .post(url)
                .send(linkWithoutName)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(400);

                    done();
                });
        });

        it('Can\'t create link without company_id (unathorized user havent compaty_id)', function (done) {
            var linkWithoutCompanyId = {
                name: links[0].attributes.name
            };

            agent
                .post(url)
                .send(linkWithoutCompanyId)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(401);

                    done();
                });
        });

        it('Create link with link_fields)', function (done) {

            userAgent1
                .post(url)
                .send(link2)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(201);

                    done();
                });
        })
    });

    describe('Test updste link by id', function () {
        var url = '/links/4';
        var newLink = {
            name: 'link 4',
            company_id: 5
        };

        it('Update link1 to link4 by id 4 and can\'t to change company_id to 5 manually', function (done) {
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

                    expect(body.model.name).to.equals(newLink.name);
                    expect(body.model.company_id).to.equals(1);

                    done();
                });
        });

        it('Nothing to update', function (done) {
            var emptyLink = {};

            userAgent1
                .put(url)
                .send(emptyLink)
                .end(function (err, res) {

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(400);

                    done();
                });
        });

        it('Try update link 4 to hasNoPermissions by id 4', function (done) {
            var newLink = {
                name: 'hasNoPermissions'
            };

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


    describe('GET links by company_id from session', function () {
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

                    done();
                });
        });

        it('Can\'t GET links when unathorized ', function (done) {
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

                    done();
                });
        });
    });

    describe('GET link by id', function () {
        var url = '/links/3';

        it('GET link by id = 3', function (done) {
            userAgent1
                .get(url)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);

                    expect(body.name).to.equals(link3.name);
                    expect(body.company_id).to.equals(2);

                    done();
                });
        });
    });

};
