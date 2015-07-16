module.exports = function counter() {
    var count = 0;
    function incr() {
        ++count;
    };
    function decr() {
        --count;
    };
    function get() {
        return (count < 0) ? 0 : count;
    }
    return {
        incr: incr,
        decr: decr,
        get: get
    };
};