'use strict';
var express = require('express');
//var multer  = require('multer');

var http = require('http');
var consolidate = require('consolidate');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var fs = require('fs');
var router = express.Router({
    caseSensitive: true,
    strict: true
});
var app = express();
//global.done=false;

if (!process.env.NODE_ENV) {
    //TODO change NODE_ENV for production server
    //process.env.NODE_ENV = 'test';
    process.env.NODE_ENV = 'development';
    //process.env.NODE_ENV = 'production';
}

if (process.env.NODE_ENV === 'production') {
    console.log('-----Server start success in Production version--------');
    require('./config/production');
} else if (process.env.NODE_ENV === 'test') {
    console.log('-----Server start success in TEST version--------');
    require('./config/test');
} else {
    console.log('-----Server start success in Development version--------');
    require('./config/development');
}

/*Configure the multer.*/

/*app.use(multer({ dest: process.env.AMAZON_S3_BUCKET,
    rename: function (fieldname, filename) {
        //return filename+Date.now();
        return filename;
    },
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
        global.done=true;
    }
}));*/

var httpServer = http.createServer(app);

app.set('port', process.env.PORT || 8850);

//<editor-fold desc="PostGre">

var Bookshelf = require('bookshelf');
var pg = require('pg');

var knex = require('knex')({
    //debug: true,
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: process.env.DATABASE
        //charset: 'utf8'
    }
});

var PostGre = require('bookshelf')(knex);
app.set('PostGre', PostGre);

var Models = require('./models/index');
PostGre.Models = new Models(PostGre);

var Collections = require('./collections/index');
PostGre.Collections = new Collections(PostGre);

//</editor-fold>

app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);
app.set('views', __dirname + '/public/static');
app.set('view engine', 'html');
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 5}));
app.use(bodyParser.json({limit: 1024 * 1024 * 5}));
app.use(methodOverride());

//<editor-fold desc="Sessions">
var session = require('express-session');
var MemoryStore = require('connect-redis')(session);
var redisConfig = {
    db: parseInt(process.env.REDIS_DB_KEY),
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379
};

app.use(session({
    name: 'LegalApp',
    secret: process.env.CLIENT_SECRET || '1q2w3e4r5tazsxdcf2d4f6h8j0jge4547hh',
    resave: true,
    saveUninitialized: false,
    store: new MemoryStore(redisConfig),
    cookie: {
        maxAge: 1000 * 3600 * 24 * 365 * 5
    }
}));
app.use(function (req, res, next) {
    if (!req.session) {
        return next(new Error('oh no')); // handle error
    }
    next(); // otherwise continue
});
//</editor-fold>

//<editor-fold desc="Deleting temporary files from NodeJS using fs">
router.use(function (req, res, next) {
    res.on('finish', function () {
        if (req.files) {
            Object.keys(req.files).forEach(function (file) {
                console.log(req.files[file].path);
                fs.unlink(req.files[file].path, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    });
    next();
});
//</editor-fold>

var allowCrossDomain = function (req, res, next) {
    var browser = req.headers['user-agent'];
    if (/Trident/.test(browser)) {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    }
    next();
};
app.use(allowCrossDomain);
app.use(router);

require('./routes/index')(app, express);

httpServer.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
    console.log("HOST: " + process.env.HOST);
    console.log("RDS_HOSTNAME: " + process.env.RDS_HOSTNAME);
    console.log("DATABASE: " + process.env.DATABASE);
    console.log("REDIS_HOST: " + process.env.REDIS_HOST);
});

module.exports = {
    app: app, 
    PostGre: PostGre
};
