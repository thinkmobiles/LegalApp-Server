var imagesUploader = function (dirConfig) {
    "use strict";

    var rootDir = dirConfig;

    var defaultUploadsDir = 'uploads';
    var defaultImageDir = 'images';

    var fs = require('fs');
    var path = require('path');
    var os = require('os');
    var mkdirp = require('mkdirp');

    var osPathData = getDirAndSlash();

    function getDirAndSlash() {
        var osType = (os.type().split('_')[0]);
        var slash;
        var dir, webDir;
        switch (osType) {
            case "Windows":
            {
                //dir = __dirname.replace("modules\\custom\\imageUploader", rootDir + "\\");
                //dir = 'public\\';
                dir = dirConfig.replace("\/", "//");
                webDir = process.env.HOST;
                slash = "\\";
            }
                break;
            case "Linux":
            {
                //dir = __dirname.replace("modules/custom/imageUploader", rootDir + "\/");
                //dir = 'public\/';
                dir = dirConfig.replace("//", "\/");
                webDir = process.env.HOST;
                slash = "\/";
            }
        }

        return {dir: dir, slash: slash, webDir: webDir}
    }

    function encodeFromBase64(dataString, callback) {
        if (!dataString) {
            callback({error: 'Invalid input string'});
            return;
        }

        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var imageData = {};

        if (!matches || matches.length !== 3) {
            try {
                imageData.type = 'image/png';
                imageData.data = new Buffer(dataString, 'base64');
                imageData.extention = 'png';
            } catch (err) {
                callback({error: 'Invalid input string'});
                return;
            }
        } else {
            imageData.type = matches[1];
            imageData.data = new Buffer(matches[2], 'base64');

            var imageTypeRegularExpression = /\/(.*?)$/;
            var imageTypeDetected = imageData
                .type
                .match(imageTypeRegularExpression);

            if (imageTypeDetected[1] === "svg+xml") {
                imageData.extention = "svg";
            } else {
                imageData.extention = imageTypeDetected[1];
            }
        }

        callback(null, imageData);
    }

    function writer(path, imageData, callback) {
        var imageNameWithExt;
        var imagePath;

        if (imageData.extention) {
            imageNameWithExt = imageData.name + '.' + imageData.extention;
        } else {
            imageNameWithExt = imageData.name;
        }

        imagePath = path + imageNameWithExt;

        try {
            fs.writeFile(imagePath, imageData.data, function (err, data) {
                if (callback && typeof callback === 'function') {
                    callback(err, {
                        name: imageData.name,
                        nameWithExtension: imageNameWithExt,
                        extension: imageData.extention
                    });
                }
            });
        }
        catch (err) {
            console.log('ERROR:', err);
            if (callback && typeof callback === 'function') {
                callback(err)
            }
        }
    }

    function getImagePath(imageName, folderName) {
        var folder = folderName || defaultImageDir;
        return process.env.HOST + '/' + defaultUploadsDir + "\/" + process.env.NODE_ENV.toLowerCase() + "\/" + folder + "\/" + imageName;
    }

    function uploadImage(imageData, imageName, folderName, callback) {
        var slash = osPathData.slash;
        //var webDir = osPathData.webDir + defaultUploadsDir + slash + folderName + slash + imageName;
        //var dir = osPathData.dir + defaultUploadsDir + slash;
        var dir = osPathData.dir + slash;
        var webDir = osPathData.webDir + slash + folderName + slash + imageName;
        encodeFromBase64(imageData, function (err, data) {
            if (err) {
                if (callback && typeof callback === 'function') {
                    return callback(err);
                } else {
                    return err;
                }
            }
            data.name = imageName;
            saveImage(data, dir, folderName, slash, callback);
        });
    }

    function saveImage(data, dir, folderName, slash, callback){
        var path;
        fs.readdir(dir, function (err) {
            if (err) {
                fs.mkdir(dir, function (err) {
                    if (!err) {
                        dir += folderName + slash;
                        fs.mkdir(dir, function (err) {
                            if (!err) {
                                path = dir;
                                writer(path, data, callback);
                            } else {
                                if (callback && typeof callback === 'function') {
                                    callback(err)
                                }
                            }
                        });
                    } else {
                        if (callback && typeof callback === 'function') {
                            callback(err)
                        }
                    }
                });
            } else {
                dir += folderName + slash;
                path = dir;
                fs.readdir(dir, function (err) {
                    if (!err) {
                        writer(path, data, callback);
                    } else {
                        fs.mkdir(dir, function (err) {
                            if (!err) {
                                writer(path, data, callback);
                            } else {
                                if (callback && typeof callback === 'function') {
                                    callback(err)
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    function duplicateImage(path, imageName, folderName, callback) {
        var slash = osPathData.slash;
        var dir = osPathData.dir + defaultUploadsDir + slash;
        var imageData ={};

        path = osPathData.dir + path;

        imageData.extention = path.substring(path.lastIndexOf('.') + 1);
        imageData.name = imageName;

        fs.readFile(path, function (err, data) {
            if (err) {
                if (callback && typeof callback === 'function') {
                    callback(err)
                }
            } else {
                imageData.data = data;
                saveImage(imageData, dir, folderName, slash, callback);
            }
        });
    }

    function removeImage(imageName, folderName, callback) {
        //var imageDir = defaultImageDir;
        var imageDir = 'uploads';
        if (folderName) {
            if (typeof folderName === 'function') {
                callback = folderName;
            } else {
                imageDir = folderName;
            }
        }
        //var imagePath = rootDir + osPathData.slash + defaultUploadsDir + osPathData.slash + imageDir + osPathData.slash + imageName;
        var imagePath = rootDir + osPathData.slash + imageDir + osPathData.slash + imageName;// + '.jpeg';
        fs.unlink(imagePath, function (err) {
            if (callback && typeof callback === 'function') {
                callback(err);
            }
        });
    }

    function removeFile(options, callback) {
        var folderName;
        var fileName;
        var dir;
        var filePath;
        var err;

        if (!options || !options.fileName || !options.folderName) {
            if (callback && (typeof callback === 'function')) {
                err = new Error('Not enough incoming params');
                err.status = 400;
                return callback(err);
            }
            return;
        }

        folderName = options.folderName;
        fileName = options.fileName;
        dir = path.join(dirConfig, folderName);
        filePath = path.join(dir, fileName);

        fs.unlink(filePath, function (err, result) {
            if (callback && typeof callback === 'function') {
                callback(err, result);
            }
        });
    }

    function writeFile(options, callback) {
        var fileName = options.fileName;
        var folderName = options.folderName;
        var filePath = options.filePath;
        var buffer = options.buffer;

        try {
            fs.writeFile(filePath, buffer, function (err, data) {
                if (callback && typeof callback === 'function') {
                    callback(err, options);
                }
            });
        }
        catch (err) {
            console.log('ERROR:', err);
            if (callback && typeof callback === 'function') {
                callback(err);
            }
        }
    }

    function saveFile(folderName, fileName, buffer, callback) {
        var dir = path.join(dirConfig, folderName);

        mkdirp(dir, function (err) {
            var filePath = path.join(dir, fileName);
            var writeOptions = {
                fileName: fileName,
                folderName: folderName,
                filePath: filePath,
                buffer: buffer
            };

            if (err) {
                if (callback && (typeof callback === 'function')) {
                    return callback(err);
                }
                return;
            }

            writeFile(writeOptions, callback);
        });
    }

    /*function uploadFile(fileData, fileName, folderName, callback) {
        var slash = osPathData.slash;
        var dir = osPathData.dir + slash;

        //fileData.name = fileName;
        var name = fileData.name;
        var buffer = fileData.data;
        var fileName;

        if (!name|| !buffer) {
            if (callback && (typeof callback === 'function')) callback(Error('Invalid value of fileData'));
        }

        //saveImage(fileData, dir, folderName, slash, callback);
        fileName = computeFileName(name, key);
        saveFile(buffer, folderName, fileName, callback);
    }*/

    //function uploadFile(folderName, fileName, buffer, callback) {
    function uploadFile(options, callback) {
        var folderName;
        var fileName;
        var buffer;
        var err;

        if (!options || !options.fileName || !options.folderName || !options.buffer) {
            if (callback && (typeof callback === 'function')) {
                err = new Error('Not enough incoming params');
                err.status = 400;
                return callback(err);
            }
            return;
        }

        folderName = options.folderName;
        fileName = options.fileName;
        buffer = options.buffer;

        saveFile(folderName, fileName, buffer, callback);
    }

    function getFilePath(fileName, folder) {
        var filePath = path.join(path.dirname( require.main.filename ), rootDir, folder, fileName);

        return filePath;
    }

    return {
        uploadImage: uploadImage,
        duplicateImage: duplicateImage,
        removeImage: removeImage,
        removeFile: removeFile,
        getImageUrl: getImagePath,
        uploadFile: uploadFile,
        getFileUrl: getImagePath,
        getFilePath: getFilePath
    };
};

module.exports = imagesUploader;
