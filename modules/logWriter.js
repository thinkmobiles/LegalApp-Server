var logWriter = function () {
    var fs = require('fs');

    function erfunc(destination, errorString, options) {
        var _dest;
        var _error;

        if (options && options.fileName) {
            _dest = options.fileName;
        } else {
            _dest = 'log.txt';
        }

        _error = errorString;

        fs.open(_dest, "a", 0644, function (err, file_handle) {
            var date;
            var res;

            if (!err) {
                date = new Date();
                res = "------------------------------" + destination + "-------------------------------------------------------\r\n"
                    + date + "\r\n" + _error + "\r\n"
                    + "---------------------------------------------------------------------------------------------------------\r\n";

                fs.write(file_handle, res, null, 'utf8', function (err, written) {
                    if (!err) {
                        fs.close(file_handle);
                    } else {
                        console.log(err);
                    }
                });
            } else {
               console.log(err);
            }
        });
    }
    return {
        log: erfunc
    }
}
module.exports = logWriter;