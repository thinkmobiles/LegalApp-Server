var BUCKETS = require('../constants/buckets');
var TABLES = require('../constants/tables');
var SessionHandler = require('../handlers/sessions');
var BadRequests = require('../modules/badRequests');
var logWriter = require('../modules/logWriter')();
var _ = require('lodash');
var async = require('async');

var imagesHandler = function (postGre) {
    'use strict';
    var badRequests = new BadRequests();
    var session = new SessionHandler(postGre);

    var models = postGre.Models;
    var PostModel = models.Post;
    var ImageModel = models.Image;
    var LikeModel = models.Likes;
    var imageUploader = ImageModel.uploader;

    var fs = require('fs');
    var self = this;

    function saveImageToDb(data, callback) {
        var saveModel;

        if (data && data.id) {
            saveModel = ImageModel.forge({id: data.id}).save(data, {patch: true});
        } else {
            saveModel = ImageModel.forge().save(data);
        }

        saveModel
            .then(function (imageModel) {
                if (callback && ( typeof( callback ) === "function" )) {
                    callback(null, imageModel);
                }
            })
            .otherwise(function (err) {
                if (callback && ( typeof( callback ) === "function" )) {
                    callback(err);
                }
            });
    }

    function prepareParams(options) {
        var imageParams = {};

        if (options && options.id) {
            imageParams.id = options.id;
        }
        if (options && options.name) {
            imageParams.name = options.name;
        }
        if (options && options.key) {
            imageParams.key = options.key;
        }
        if (options && options.post_id) {
            imageParams.post_id = options.post_id;
        }

        return imageParams;
    }

    function random(number) {
        return Math.floor((Math.random() * number));
    }

    function computeKey(name, ticks) {
        var key;
        //key = name + '_' + ticks + '_' + random(1000);
        key = ticks + '_' + random(1000);
        return key;
    }

    function likeAndIncrement(imageModel, likeOptions, callback) {
        async.parallel([

                //insert into likes:
                function (cb) {
                    LikeModel
                        .forge()
                        .save(likeOptions)
                        .then(function (like) {
                            cb();
                        })
                        .catch(function (err) {
                            cb(err);
                        });
                },

                //increment the likes_count for the imageModel:
                function (cb) {
                    var likesCount = imageModel.get('likes_count') + 1;
                    var saveData = {
                        likes_count: likesCount
                    };

                    imageModel
                        .save(saveData, {patch: true})
                        .then(function () {
                            cb();
                        })
                        .catch(function (err) {
                            cb(err);
                        });
                }
            ],
            function (err) { //global callback for parallel
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
    };

    function unlikeAndDecrement(imageModel, likeModel, callback) {

        async.parallel([

                //decrement the old image's likes_count:
                function (cb) {
                    postGre.knex(TABLES.IMAGES)
                        .where('id', imageModel.id)
                        .decrement('likes_count', 1)
                        .then(function () {
                            cb();
                        })
                        .catch(function (err) {
                            cb(err)
                        });
                },

                //delete from likes:
                function (cb) {
                    likeModel
                        .destroy()
                        .then(function () {
                            cb();
                        })
                        .catch(function (err) {
                            cb(err);
                        });
                }

            ],
            function (err) { //global callback for parallel
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
    };

    function removeLikeFromRedis(imageId, userId, callback) {
        var storage = redisClient.cacheStore; //redisClient from globals
        var setName = TABLES.LIKES + ':' + imageId;

        storage.delFromSet(setName, userId, function (err, result) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, result);
                }
            }
        });
    };

    function saveLikeIntoRedis(imageId, userId, callback) {
        var storage = redisClient.cacheStore; //redisClient from globals
        var setName = TABLES.LIKES + ':' + imageId;

        storage.addToSet(setName, userId, function (err, result) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, result);

                }
            }
        })
    };

    this.saveImage = function (image, callback) {
        var ticks;
        var bucket;
        var fileName;
        var saveParams;
        var post_id;
        var oldImageName;
        var newImageName;

        if (!image || !image.post_id || !image.imageSrc) {
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['image', 'image.post_id', 'image.imageSrc']}));
            }
            return;

        } else if (image.id && !image.name && !image.key) { //we most know the image's name which will updated
            if (callback && (typeof callback === 'function')) {
                callback(badRequests.NotEnParams({reqParams: ['image.name', 'image.key']}));
            }
            return;

        } else {

            bucket = BUCKETS.POSTS;

            if (image && image.id) { //update (we must remove the old image);
                oldImageName = ImageModel.getFileName(image.name, image.key);
                imageUploader.removeImage(oldImageName, bucket, function (err) {
                    if (err) {
                        if (process.env.NODE_ENV !== 'production') {
                            console.error(err);
                            logWriter.log('handlers/images -> saveImage -> imageUploader.removeImage', err);
                        }
                    }
                });
            }

            ticks = new Date().valueOf();
            post_id = image.post_id;
            fileName = bucket + '_' + post_id;
            image.key = computeKey(fileName, ticks);
            image.name = fileName;
            saveParams = prepareParams(image);

            newImageName = image.key + '_' + image.name;
            imageUploader.uploadImage(image.imageSrc, newImageName, bucket, function (err, saveImageName) {
                if (err) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error(err);
                        logWriter.log('handlers/images -> saveImage -> imageUploader.uploadImage', err);
                    }
                }

                saveImageToDb(saveParams, callback);

            });
        }
    };

    this.saveImages = function (postId, images, callback) {
        async.each(
            images,
            function (image, cb) {
                var imgData = {
                    imageSrc: image,
                    post_id: postId
                };
                self.saveImage(imgData, function (err) {
                    if (err) {
                        cb(err);
                    } else {
                        cb();
                    }
                });
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
    };

    this.removeImage = function (imageModel, callback) {
        /*var bucket = BUCKETS.POSTS;
         var imageName;*/

        imageModel
            .destroy()
            .then(function () {
                if (callback && (typeof callback === 'function')) {
                    callback(null);
                }
            })
            .otherwise(function (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            });
        /*if (imageModel && imageModel.id) {

         bucket = BUCKETS.POSTS;
         imageName = ImageModel.getFileName(imageModel.get('name'), imageModel.get('key'));
         imageUploader.removeImage(imageName, bucket, function (err) {
         if (err) {
         callback(err);
         } else {
         imageModel
         .destroy()
         .then(function () {
         callback(null);
         })
         .otherwise(function (err) {
         callback(err);
         })
         }
         });
         } else {
         callback(null);
         }*/
    };

    this.whoLikesPhoto = function (req, res, next) {
        var imageId = req.params.id;
        var page = req.query.page || 1;
        var limit = req.query.count || 25;
        var orderBy = req.query.orderBy;
        var order = req.query.order || 'ASC';

        ImageModel
            .forge({
                id: imageId
            })
            .fetch({
                require: true
            })
            .then(function (image) {
                var likeUsers = image.related('likeUsers');
                likeUsers
                    .query(function (qb) {
                        qb.offset(( page - 1 ) * limit)
                            .limit(limit);

                        if (orderBy) {
                            qb.orderBy(orderBy, order);
                        }
                    })
                    .fetch()
                    .then(function (users) {
                        res.status(200).send(users);
                    })
                    .otherwise(next);
            })
            .otherwise(next);
    };

    this.countLikes = function (req, res, next) {
        var imageId = req.params.id;

        ImageModel
            .forge({
                id: imageId
            })
            .fetch({
                require: true
            })
            .then(function (image) {
                var count = image.get('likes_count');
                res.status(200).send({count: count});
            })
            .otherwise(next);
    };

    this.likePhoto = function (req, res, next) {
        var imageId = req.params.id;
        var userId = req.session.userId;
        var likeOptions;

        ImageModel
            .forge({
                id: imageId
            })
            .fetch({
                require: true
            })
            .then(function (image) {
                var postId = image.get('post_id');
                var queryOptions = {
                    postId: postId
                };
                var privacyOptions = session.getPrivacyParams(req);
                var fetchOptions = {
                    require: true
                };

                //fetch the postModel to check access to the post:
                PostModel
                    .fetchMe(queryOptions, privacyOptions, fetchOptions)
                    .then(function (post) {
                        var now = new Date();

                        //is voting is active?
                        if (post.get('end_datetime') < now) {
                            next(new badRequests.VoteTimeOutError({status: 400}));
                        } else {

                            //Check is photo is not liked previously:
                            LikeModel
                                .forge({
                                    post_id: postId,
                                    user_id: userId
                                })
                                .fetch()
                                .then(function (like) {
                                    if (like && like.id) {

                                        if (like.get('image_id') == imageId) {
                                            unlikeAndDecrement(image, like, function (err) {
                                                if (err) {
                                                    next(err);
                                                } else {
                                                    res.status(200).send({success: 'Unliked'});
                                                    removeLikeFromRedis(imageId, userId);
                                                }
                                            });
                                        } else {

                                            next(badRequests.AccessError({message: 'You can only like one photo per post. Unlike the photo to choose another.'}));
                                        }

                                    } else {
                                        likeOptions = {
                                            post_id: postId,
                                            user_id: userId,
                                            image_id: imageId
                                        };

                                        likeAndIncrement(image, likeOptions, function (err) {
                                            if (err) {
                                                next(err);
                                            } else {
                                                res.status(201).send({success: 'Liked'});
                                                saveLikeIntoRedis(imageId, userId);
                                            }
                                        });
                                    }
                                });
                        }
                    })
                    .catch(PostModel.NotFoundError, function (err) {
                        next(badRequests.NotFound());
                    })
                    .catch(next);

            })
            .catch(ImageModel.NotFoundError, function (err) {
                next(badRequests.NotFound());
            })
            .catch(next);
    };

    this.isLikedByUser = function (userId, imageId, callback) {
        var key = TABLES.LIKES + ':' + imageId;
        var storage = redisClient.cacheStore; //redisClient from globals
        var userIdString;

        if (typeof userId === 'string') {
            userIdString = userId;
        } else {
            userIdString = '' + userId;
        }

        storage.getTheSetItems(key, function (err, userIds) {
            var isLiked;

            if (err) {
                callback(err);
            } else {

                if (userIds.indexOf(userIdString) !== -1) {
                    isLiked = true;
                } else {
                    isLiked = false;
                }

                callback(null, isLiked);
            }
        });

    }

    this.saveLikesIntoRedisOnStartServer = function (storage) {

        postGre.knex('likes')
            .innerJoin('users', 'likes.user_id', 'users.id')
            .innerJoin('images', 'likes.image_id', 'images.id')
            .orderBy('images.id')
            .select('likes.image_id', 'likes.user_id')
            .then(function (likes) {
                var results = {};

                async.each(
                    likes,
                    function (like, cb) {
                        var key = TABLES.LIKES + ':' + like.image_id;

                        storage.addToSet(key, like.user_id);
                        storage.getTheSetItems(key, function (err, items) {
                            if (err) {
                                console.log(err);
                                cb(err);
                            } else {
                                results[key] = items;
                                cb();
                            }
                        });

                    }, function (err) {
                        if (err) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.error(err);
                            }
                        } else {
                            if (process.env.NODE_ENV !== 'production') {
                                console.log('------------------');
                                console.log('saveLikesIntoRedisOnStartServer: ');
                                console.dir(results);
                                console.log('------------------');
                            }
                        }
                    });
            })
            .catch(function (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            });
    }

};

module.exports = imagesHandler;