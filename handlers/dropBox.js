/**
 * Created by kille on 30.07.2015.
 */
'use strict';

var async = require('async');
var badRequests = require('../helpers/badRequests');
var Dropbox = require('dropbox');
var client = new Dropbox.Client({
    key: "ew8n90l8x9rdq3j",
    secret: "2krnjnkul5fpv5k"
});
client._oauth._token = 'M9fP5j5gG1AAAAAAAAAACiBMqwHjQQtZFr-9pF1WJTK2Q_sXp8gfrcAv2U2E18G8';

var DropBoxHandler = function (PostGre) {


    this.getAccountInfo = function (req, res, next) {

        client.getAccountInfo(function (err, accountInfo) {
            if (err) {
                return next(err);
            }
            res.status(200).send(accountInfo);
        });
    };


};

module.exports = DropBoxHandler;
