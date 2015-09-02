'use strict';

var MESSAGES = require('../constants/messages');
var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var UserHandler = require('../handlers/users');
var LinksHandler = require('../handlers/links');
var ImageHandler = require('../handlers/images');
var MammothHandler = require('../handlers/mammoth');
var DocumentsHandler = require('../handlers/documents');

module.exports = function (app) {
    var logWriter = require('../helpers/logWriter')();
    var PostGre = app.get('PostGre');
    var session = new SessionHandler(PostGre);
    var users = new UserHandler(PostGre);
    var links = new LinksHandler(PostGre);
    var images = new ImageHandler(PostGre);
    var mammothHandler = new MammothHandler(PostGre);
    var documentsHandler = new DocumentsHandler(PostGre);
    var usersRouter = require('./users')(app);
    var attachments = require('./attachments')(app);
    var companiesRouter = require('./companies')(app);
    var documentsRouter = require('./documents')(app);
    var fieldsRouter = require('./fields')(app);
    var linksFieldsRouter = require('./linksFields')(app);
    var linksRouter = require('./links')(app);
    var templatesRouter = require('./templates')(app);

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });
    app.get('/isAuth', session.isAuthenticatedUser);
    app.post('/signUp', users.signUp);
    app.post('/signIn', users.signIn);
    app.post('/signIn/:inviteToken', users.firstSignIn);
    app.get('/confirmEmail/:confirmToken', users.confirmEmail);
    app.post('/signOut', session.kill);
    app.get('/currentUser', session.authenticatedUser, users.getCurrentUser);
    app.put('/profile',  users.changeProfile);
    app.post('/forgotPassword', users.forgotPassword);
    app.post('/changePassword/:forgotToken', users.changePassword);
    app.get('/clients', session.authenticatedUser, users.getClients);
    app.put('/clients/:id', session.authenticatedAdmin, users.updateUser);
    app.post('/helpMe', users.helpMe);

    app.get('/getAvatar', session.authenticatedUser, images.getUserAvatar);
    app.get('/getLogo', session.authenticatedUser, images.getCompanyLogo);
    app.get('/getHtml', mammothHandler.docxToHtml);

    app.use('/companies', companiesRouter);
    app.use('/documents', documentsRouter);
    app.use('/fields', fieldsRouter);
    app.use('/linksFields', linksFieldsRouter);
    app.use('/links', linksRouter);
    app.use('/users', usersRouter);
    app.use('/templates', templatesRouter);
    //app.use('/uploadFile', attachments);

    app.get('/htmlToPdf', documentsHandler.htmlToPdf);

    app.get('/error', function (req, res, next) {
        res.render('errorTemplate'); //Internal Server Error
    });
    app.get('/successConfirm', function (req, res, next) {
        res.render('successConfirm.html');
    });

    function notFound(req, res, next) {
        var accepts = req.headers['accept'];

        res.status(404);

        if (accepts.indexOf('json') !== -1) {
            return res.json({error: MESSAGES.PAGE_NOT_FOUND});
        }

        if (req.accepts('html')) {
            return res.send(MESSAGES.PAGE_NOT_FOUND);
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