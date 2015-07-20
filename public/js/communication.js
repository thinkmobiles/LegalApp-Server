/**
 * Created by andrey on 16.07.15.
 */

define(function () {

    var checkLogin = function (callback) {
        $.ajax({
            url    : "/admin/currentAdmin",
            type   : "GET",

            success: function (data) {
                return callback(null, data);
            },
            error  : function (data) {
                return callback(data);
            }
        });
    };

    return {
        checkLogin: checkLogin
    }
});