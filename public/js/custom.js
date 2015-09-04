/**
 * Created by andrey on 16.07.15.
 */

define([],function () {

    var runApplication = function (err, data) {
        var url;
        url =  Backbone.history.fragment || Backbone.history.getFragment();

        if (url === "") {
            url = 'users';
        }

        if (Backbone.history.fragment) {
            Backbone.history.fragment = '';
        }

        if (!err) {
            App.sessionData.set({
                authorized : true,
                user       : data.profile.first_name+' '+data.profile.last_name,
                role       : data.profile.permissions,
                company    : data.company[0].id,
                userId     : data.id
            });
            $('body').addClass('loggedState');

            return Backbone.history.navigate(url, {trigger: true});
        } else {
            App.sessionData.set({
                authorized : false,
                user       : null,
                role       : null,
                company    : null,
                userId     : null
            });
            $('body').removeClass('loggedState');

            return Backbone.history.navigate(url, {trigger: true});
        }

    };

    var canvasDraw = function (argImage, argContext) {
        var currentImage = (argImage && argImage.imageSrc) ? argImage.imageSrc : null;
        var context = (argContext) ? argContext : this;
        var canvas = context.$('#avatar')[0];
        var inputFile = context.$('#inputImg');
        inputFile.prop('accept', "image/*");
        inputFile.on('change', function (event) {
            event.preventDefault();

            var file = inputFile[0].files[0];
            var filesExt = ['jpg','png','jpeg', 'bmp', 'JPEG', 'JPG', 'PNG', 'BMP'];
            var parts = $(inputFile).val().split('.');
            if (filesExt.join().search(parts[parts.length - 1]) != -1) {
                var fr = new FileReader();
                fr.onload = function () {
                    var src =fr.result;
                    canvasDrawing({imageSrc: src, canvas: canvas}, context);
                };

                fr.readAsDataURL(file);

            } else {
                alert('Invalid file type!');
            }
        });
        canvasDrawing({
            imageSrc : currentImage,
            canvas   : canvas
        }, context);

    };

    var canvasDrawing = function (options, context) {
        var canva_width;
        var canva_height;
        var canvas = (options.canvas) ? options.canvas : context.$('#avatar')[0];
        canva_width = canvas.width;
        canva_height = canvas.height;
        var currentImage = (options.imageSrc) ? options.imageSrc : "data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC";
        var img = new Image();
        img.onload = function () {
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canva_width, canva_height);
            ctx.drawImage(img, 0, 0, canva_width, canva_height);
        };
        img.src = currentImage;
    };

    var signatureLoad = function (self, callback) {
        var inputFile = self.$el.find('#inputImg');

        inputFile.on('change', function (event) {
            event.preventDefault();

            var file = inputFile[0].files[0];
            var filesExt = 'jpg';
            var parts = inputFile.val().split('.');

            if (filesExt === parts[parts.length - 1]) {
                var fr = new FileReader();
                fr.onload = function () {
                    var result =fr.result;
                    callback(result);
                };
                fr.readAsDataURL(file);

            } else {
                alert('Invalid file type!');
            }
        });
    };

    /*var docXLoad = function (argContext, callback) {
        var context = (argContext) ? argContext : this;
        var inputFile = context.$('#tempFile');
        inputFile.on('change', function (event) {
            event.preventDefault();

            var file = inputFile[0].files[0];
            var filesExt = 'docx';
            var parts = $(inputFile).val().split('.');
            if (filesExt === parts[parts.length - 1]) {
                var fr = new FileReader();
                fr.onload = function () {
                    //var result =fr.result;
                    callback(file);
                };
                //inputFile.val('');
                fr.readAsDataURL(file);

            } else {
                alert('Invalid file type!');
            }
        });
    };*/

    /*var getLinkTables = function (id, url, data, content, isCreate, canBeEmpty) {
        $.ajax({
            url  : url,
            data : data,
            type : 'GET',

            success : function(response){
                content.linkNames = [];
                if (canBeEmpty) {
                    content.linkNames.push({id: "", name: "Select"});
                }
                content.linkNames = content.linkNames.concat(_.map(response, function (item) {
                    return {id: item.id, name: item.name};
                }));

                if (isCreate) {
                    $(id).text(content.responseObj[id][0].name).attr("data-id", content.responseObj[id][0]._id);
                }
            }
        });
    };*/

    return {
        runApplication : runApplication,
        canvasDraw     : canvasDraw,
        canvasDrawing  : canvasDrawing,
        signatureLoad  : signatureLoad
    };
});
