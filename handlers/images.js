var BUCKETS = require('../constants/buckets');
var CONSTANTS = require('../constants/index');
var TABLES = require('../constants/tables');

var SessionHandler = require('../handlers/sessions');
var badRequests = require('../helpers/badRequests');

var _ = require('lodash');
var async = require('async');

var imagesHandler = function (PostGre) {
    'use strict';
    var session = new SessionHandler(PostGre);

    var Models = PostGre.Models;
    //var PostModel = Models.Post;
    var ImageModel = Models.Image;
    //var LikeModel = Models.Likes;
    var imageUploader = ImageModel.uploader;

    var fs = require('fs');
    var self = this;

    function saveImageToDb(data, callback) {
        var criteria = {
            imageable_id: data.imageable_id,
            imageable_type: data.imageable_type
        };
        var fetchOptions = {
            require: true
        };

        if (data && data.imageable_id && data.imageable_type) {
            ImageModel
                .find(criteria, fetchOptions)
                .then(function (imageModel) {
                    imageModel
                        .save(data, {patch: true})
                        .exec(function (err, savedImageModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, savedImageModel);
                        })
                })
                .catch(ImageModel.NotFoundError, function (err) {
                    ImageModel
                        .forge(criteria)
                        .save(data)
                        .exec(function (err, savedImageModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, savedImageModel);
                        })
                })
                .catch(callback)
        } else {
            callback(null, {});
        }
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
        if (options && options.imageable_id) {
            imageParams.imageable_id = options.imageable_id;
        }
        if (options && options.imageable_type) {
            imageParams.imageable_type = options.imageable_type;
        }
        /*if (options && options.post_id) {
         imageParams.post_id = options.post_id;
         }*/

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

    this.saveImage = function (image, callback) {
        var ticks;
        var bucket;
        var fileName;
        var saveParams;
        var imageableId;
        var oldImageName;
        var newImageName;

        if (image.imageable_type === 'users') {
            bucket = BUCKETS.AVATARS;
        }

        if (image.imageable_type === 'companies') {
            bucket = BUCKETS.LOGOS;
        }

        // remove the old file
        if (image && image.oldName && image.oldKey) {
            oldImageName = ImageModel.getFileName(image.oldName, image.oldKey);
            imageUploader.removeImage(oldImageName, bucket, function (err) {
                if (err) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error(err);
                        // logWriter.log('handlers/images -> saveImage -> imageUploader.removeImage', err);
                    }
                }
            });
        }

        ticks = new Date().valueOf();
        imageableId = image.imageable_id;
        fileName = bucket + '_' + imageableId;
        image.key = computeKey(fileName, ticks);
        image.name = fileName;
        saveParams = prepareParams(image);

        newImageName = image.key + '_' + image.name;
        imageUploader.uploadImage(image.imageSrc, newImageName, bucket, function (err, saveImageName) {
            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                    // logWriter.log('handlers/images -> saveImage -> imageUploader.uploadImage', err);
                }
            }

            saveImageToDb(saveParams, callback);

        });
    };

    this.removeImage = function (imageModel, callback) {

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
    };

    this.getUserAvatar = function (req, res, next) {
        var userId = req.session.userId;
        var imageableId = userId;
        var imageableType = 'users';
        var companyId = req.session.companyId; //TODO some check permissions or members of company
        var criteria = {
            imageable_id: imageableId,
            imageable_type: imageableType
        };
        var imageName;
        var key;
        var imageUrl;
        var bucket = BUCKETS.AVATARS;

        if (!imageableId || !imageableType) {
            return next(badRequests.NotEnParams({required: 'user_id'}));
        }

        ImageModel
            .find(criteria)
            .then(function (imageModel) {

                if (imageModel && imageModel.id) {
                    imageName = imageModel.attributes.name;
                    key = imageModel.attributes.key;
                    imageUrl = ImageModel.getImageUrl(imageName, key, bucket);
                } else {
                    imageUrl = PostGre.Models.Image.uploader.getFileUrl(CONSTANTS.DEFAULT_AVATAR_URL, bucket);
                }

                res.status(200).send(imageUrl);
            })
            .catch(next);

    };

    this.getCompanyLogo = function (req, res, next) {
        var companyId = req.session.companyId; //TODO some check permissions or members of company
        var imageableId = companyId;
        var imageableType = 'companies';

        var criteria = {
            imageable_id: imageableId,
            imageable_type: imageableType
        };
        var fetchOptions = {
            require: true
        };
        var imageName;
        var key;
        var imageUrl;
        var bucket = BUCKETS.LOGOS;


        if (imageableId && imageableType) {
            ImageModel
                .find(criteria, fetchOptions)
                .then(function (imageModel) {
                    imageName = imageModel.attributes.name;
                    key = imageModel.attributes.key;
                    imageUrl = ImageModel.getImageUrl(imageName, key, bucket);

                    res.status(200).send(imageUrl);
                })
                .catch(ImageModel.NotFoundError, function (err) {
                    res.status(200).send(''); //send default image (when company dont have logo)
                })
                .catch(next);


        } else {
            next(badRequests.NotEnParams({required: 'company_id'}))
        }
    };

    /*this.whoLikesPhoto = function (req, res, next) {
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

     PostGre.knex('likes')
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
     }*/

};

module.exports = imagesHandler;