// JavaScript source code
var randomPass = (function randomPass() {

    var uuid = require('node-uuid')();

    function generate(passLength) {
        var useTime = false;
        if (!passLength) {
            useTime = true;
            passLength = 50;
        }

        var now = (new Date()).valueOf();
        var alphabetical = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890' + now;
        var res = '';

        function randomNumber(m) {
            return Math.floor((Math.random() * m));
        }

        var doit = true;
        var i = 0;
        while (doit) {
            res += alphabetical.substr(randomNumber(alphabetical.length), 1);
            if (i === passLength) {
                doit = false;
            }
            i++;
        }
        if (!doit) {
            if (useTime) {
                return (res + now);
            }
            return res;
        }
    };

    function generateUuid() {
        var uuidLocal = uuid;
        return uuidLocal;
    };

    return {
        generate: generate,
        generateUuid: generateUuid
    };
})();

module.exports = randomPass;

