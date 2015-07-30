'use strict';

var MESSAGES = require('../constants/messages');
var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var UserHandler = require('../handlers/users');
var LinksHandler = require('../handlers/links');

module.exports = function (app) {
    var logWriter = require('../helpers/logWriter')();
    var PostGre = app.get('PostGre');
    var session = new SessionHandler(PostGre);
    var users = new UserHandler(PostGre);
    var links = new LinksHandler(PostGre);
    var usersRouter = require('./users')(app);
    var attachments = require('./attachments')(app);
    var linksRouter = require('./links')(app);
    var linksFieldsRouter = require('./linksFields')(app);
    var templatesRouter = require('./templates')(app);
    var dropBoxRouter = require('./dropBox')(app);

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });
    app.get('/isAuth', session.isAuthenticatedUser);
    app.post('/signUp', users.signUp);
    app.post('/signIn', users.signIn);
    app.get('/confirmEmail/:confirmToken', users.confirmEmail);
    app.post('/signOut', session.kill);
    app.get('/currentUser', session.authenticatedUser, users.getCurrentUser);
    app.put('/profile', session.authenticatedUser, users.changeProfile);
    app.post('/forgotPassword', users.forgotPassword);
    app.post('/changePassword/:forgotToken', users.changePassword);

    app.get('/error', function (req, res, next) {
        res.render('errorTemplate'); //Internal Server Error
    });
    app.get('/successConfirm', function (req, res, next) {
        res.render('successConfirm.html');
    });

    app.use('/users', usersRouter);
    app.post('/uploadFile', attachments);
    app.use('/links', linksRouter);
    app.use('/linksFields', linksFieldsRouter);
    app.use('/templates', templatesRouter);

    app.use('/dropbox', dropBoxRouter);

    function notFound(req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(MESSAGES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: MESSAGES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(MESSAGES.PAGE_NOT_FOUND);
    }

    function errorHandler(err, req, res, next) {
        var status = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            if ((status === 401) || (status === 403)) {
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(status).send({error: err.message});

        } else {
            if ((status === 401) || (status === 403)) {
                console.warn(err.message);
            } else {
                console.error(err.message);
                if (process.env.NODE_ENV !== 'test') console.error(err.stack);
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(status).send({error: err.message, stack: err.stack});
        }

        //next();
    }

    app.use(notFound);
    app.use(errorHandler);

    //return app;
};