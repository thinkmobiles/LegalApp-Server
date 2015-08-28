'use strict';

var CONSTANTS = require('../constants/index');

var path = require('path');
var fs = require('fs');
var Buffer = require('buffer').Buffer;
var crypto = require('crypto');

var DSignatureModule = function () {
    var self = this;

    this.encryptHash = function (text, userSecretKey) {
        var algorithm = 'aes-256-ctr';
        var password = userSecretKey;
        var cipher = crypto.createCipher(algorithm, password);
        var crypted = cipher.update(text, 'utf8', 'hex');

        crypted += cipher.final('hex');

        return crypted;
    };

    this.decryptHash = function (text, userSecretKey) {
        var algorithm = 'aes-256-ctr';
        var password = userSecretKey;
        var decipher = crypto.createDecipher(algorithm, password);
        var dec = decipher.update(text, 'hex', 'utf8');

        dec += decipher.final('utf8');

        return dec;
    };

    this.getDocumentHash = function (filePath) {
        var shasum = crypto.createHash('sha1');
        var fileData = fs.readFileSync(filePath);
        var data = fileData.toString();
        var startIndex = data.indexOf('SecretKey/');
        var message;

        if (startIndex !== -1) {
            message = data.substring(12 + CONSTANTS.KEY_LENGTH, fileData.length);
        } else {
            message = data;
        }

        shasum.update(message);

        return shasum.digest('hex');
    };

    this.writeKeyToDocument = function (filePath, key, callback) {
        var dataBuffer = fs.readFileSync(filePath);
        var data = dataBuffer.toString();
        var startIndex = data.indexOf('SecretKey/');
        var secretKey = 'SecretKey/' + key + '/\n';
        var newBuffer = new Buffer(secretKey, 'utf8');

        //check if need to replace old value
        if (startIndex !== -1) {
            dataBuffer = dataBuffer.slice(newBuffer.length, dataBuffer.length);
        }

        if (key === null) {
            newBuffer = dataBuffer;
        } else {
            newBuffer = Buffer.concat([newBuffer, dataBuffer]);
        }

        fs.writeFile(filePath, newBuffer, function (err) {
            if (err) {
                return callback(err);
            }
            callback(null, true);
        });
    };

    this.readKeyFromDocument = function (filePath, callback) {
        var data = fs.readFileSync(filePath, 'utf8');
        var startIndex = data.indexOf('SecretKey/') + 10; // 'SecretKey/'.length=10
        var keyLength = startIndex + CONSTANTS.KEY_LENGTH;
        var key;

        if (startIndex === -1) {
            callback(badRequests.NotFound({required: 'key'}));
        } else {
            key = data.substring(startIndex, keyLength);
            callback(null, key);
        }
    };

    this.addEncryptedDataToDocument = function (filePath, secretKey, callback) {
        var openKey = CONSTANTS.OPEN_KEY;
        var hash = self.getDocumentHash(filePath);
        var hashPlusKey;
        var encryptedHash;

        hashPlusKey = hash + secretKey;
        encryptedHash = self.encryptHash(hashPlusKey, openKey);

        self.writeKeyToDocument(filePath, encryptedHash, function (err) {
            if (err) {
                return callback(err)
            }
            callback(null, {success: 'D-Signature was added to document'});
        });
    };
};

module.exports = new DSignatureModule ();
