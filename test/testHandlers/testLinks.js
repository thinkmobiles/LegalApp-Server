/**
 * Created by kille on 28.07.2015.
 */
'use strict';

var FIELD_TYPES = require('../../constants/fieldTypes');
var MESSAGES = require('../../constants/messages');
var PERMISSIONS = require('../../constants/permissions');
var TABLES = require('../../constants/tables');

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
        link_fields: [
            {
                name: linkFields[0].attributes.name,
                code: linkFields[0].attributes.code,
                type: linkFields[0].attributes.type
            },
            {
                name: linkFields[1].attributes.name,
                code: linkFields[1].attributes.code,
                type: linkFields[1].attributes.type
            },
            {
                name: linkFields[2].attributes.name,
                code: linkFields[2].attributes.code,
                type: linkFields[2].attributes.type
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

    describe('CREATE links', function () {
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
                            expect(linkModelJSON.company_id).to.equals(2);

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

        it('Can\'t create link without company_id (unauthorized user havent compaty_id)', function (done) {
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
                    var body;

                    if (err) {
                        return done(err);
                    }
                    body = res.body;

                    expect(res.status).to.equals(201);
                    expect(body).to.have.property('model');
                    expect(body.model.name).to.equals(link2.name);
                    expect(body.model.company_id).to.equals(2);
                    /*expect(body.model.link_fields[0].name).to.equals(link2.link_fields[0].name);
                    expect(body.model.link_fields[0].code).to.equals(link2.link_fields[0].code);*/

                    done();
                });
        })
    });

    describe('UPDATE link by id', function () {
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
                    expect(body.model.company_id).to.equals(2);

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

        it('Unauthorized user can\'t update link', function (done) {
            var newLink = {
                name: 'Unauthorized'
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


    describe('GET link', function () {
        var url = '/links/';
        var urlByID = '/links/3';

        it('GET links by company_id = 1 from session', function (done) {
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
                    expect(body[0].company_id).to.equals(2);

                    done();
                });
        });

        it('Can\'t GET links when unauthorized ', function (done) {
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

        it('Can\'t GET link by id = 3 (from another company)', function (done) {
            userAgent1
                .get(urlByID)
                .end(function (err, res) {
                    var body;

                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(400);

                    body = res.body;

                    expect(body).to.be.instanceOf(Object);

                    expect(body.name).to.not.equals(link3.name);
                    expect(body.company_id).to.not.equals(2);

                    done();
                });
        });
    });

    describe('DELETE link', function () {
        var url = '/links/1';
        var url2 = '/links/150';
        var url3 = '/links/2';

        it('Delete link by id = 1', function (done) {
            userAgent1
                .delete(url)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);

                    LinkModel
                        .find({id: 1}, {require: true})
                        .then(function (linkModel) {
                            err = new Error('delete is not complete (link was found in DB)');
                            done(err);
                        })
                        .catch(LinkModel.NotFoundError, function (err) {
                            done();
                        });
                });
        });

        it('Delete not existed link', function (done) {
            userAgent1
                .delete(url2)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(200);

                    done();
                });
        });

        it('Delete link when unauthorized', function (done) {
            agent
                .delete(url3)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res.status).to.equals(401);

                    done();
                });
        });
    });
};
