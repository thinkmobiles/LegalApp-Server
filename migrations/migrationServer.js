
var express = require('express');
var http = require('http');

//TODO change NODE_ENV for production server
process.env.NODE_ENV = 'test';

//development only

if (process.env.NODE_ENV === 'production') {
    console.log('-----Server start success in Production version--------');
    require('../config/production');
} else if (process.env.NODE_ENV === 'test') {
    console.log('-----Server start success in TEST version--------');
    require('../config/test');
} else {
    console.log('-----Server start success in Development version--------');
    require('../config/development');
}


var Knex = require('knex');
var pg = require('pg');
var Promise = require('bluebird');

Knex.knex = Knex.initialize({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: process.env.DATABASE
    }

});

var knex = Knex.knex;
var schema = require('./schema')(knex, Promise);
var bookshelf = require('bookshelf')(knex);

var app = express();
var server = http.createServer(app);

app.configure(function () {
    app.set('port', 8081);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname, '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', function (req, res) {
    var html = "";
    html+='<h2>Database Operations</h2><hr/>';

    html+='<a href="/databases/create">Create Tables</a><br/>';
    html+='<a href="/databases/drop">Drop Tables</a><br/>';
    //html+='<a href="/seed/default">Seed Default</a><br/>';
    //html+='<a href="/seed/fake">Seed Fake</a><br/>';

    res.send(html);
});

app.get('/databases/create', function (req, res) {
    schema.create();
    res.send('<b>Crate Take Success</b>');
});

app.get('/databases/drop', function (req, res) {
    schema.drop();
    res.send('<b>Drop Take Success</b>');
});

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
    console.log("RDS_HOSTNAME: " +  process.env.RDS_HOSTNAME);
    console.log("DATABASE: " +  process.env.DATABASE);
});


